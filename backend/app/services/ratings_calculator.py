from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
import math
from statistics import pstdev
from datetime import date

from app.models.rating import Rating
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop

class RatingsCalculator:
    @staticmethod
    def get_engagement_history(db: Session, total_active_users: int) -> List[Dict[str, Any]]:
        """Return engagement data for active/past drops only, in chronological order."""
        eligible_drops = (
            db.query(WeeklyDrop)
            .filter(
                (WeeklyDrop.start_date <= date.today()) | (WeeklyDrop.is_active == True)
            )
            .order_by(WeeklyDrop.start_date.asc())
            .all()
        )

        engagement_data = []
        for drop in eligible_drops:
            on_time_votes = db.query(Rating).filter(Rating.weekly_drop_id == drop.id, Rating.is_late == False).count()
            late_votes = db.query(Rating).filter(Rating.weekly_drop_id == drop.id, Rating.is_late == True).count()
            engagement_data.append({
                "drop_id": drop.id,
                "movie_title": drop.movie.title if drop.movie else f"Drop {drop.id}",
                "date": drop.start_date.isoformat(),
                "on_time_votes": on_time_votes,
                "late_votes": late_votes,
                "total_users": total_active_users
            })

        return engagement_data

    @staticmethod
    def calculate_average_score(db: Session, movie_id: int) -> float:
        avg = db.query(func.avg(Rating.overall_score)).filter(Rating.movie_id == movie_id, Rating.is_approved == True).scalar()
        return round(float(avg), 1) if avg is not None else 0.0

    @staticmethod
    def calculate_drop_average_score(db: Session, drop_id: int) -> float:
        avg = db.query(func.avg(Rating.overall_score)).filter(Rating.weekly_drop_id == drop_id, Rating.is_approved == True).scalar()
        return round(float(avg), 1) if avg is not None else 0.0

    @staticmethod
    def calculate_divisiveness(db: Session) -> Dict[str, Any]:
        """Find the most divisive movie based on score spread."""
        movie_rows = (
            db.query(Movie)
            .join(Rating, Rating.movie_id == Movie.id)
            .filter(Rating.is_approved == True)
            .all()
        )

        best_result = {"movie_id": None, "title": "N/A", "variance": 0.0}
        for movie in movie_rows:
            scores = [
                rating.overall_score
                for rating in db.query(Rating)
                .filter(Rating.movie_id == movie.id, Rating.is_approved == True)
                .all()
            ]
            if len(scores) < 2:
                continue
            variance = round(float(pstdev(scores)), 2)
            if variance > best_result["variance"]:
                best_result = {"movie_id": movie.id, "title": movie.title, "variance": variance}

        if best_result["movie_id"] is not None:
            return best_result
        return {"movie_id": None, "title": "N/A", "variance": 0.0}

    @staticmethod
    def get_sentiment_distribution(db: Session, drop_id: int) -> List[Dict[str, Any]]:
        """Get distribution of overall scores in buckets of 10."""
        ratings = db.query(Rating.overall_score).filter(Rating.weekly_drop_id == drop_id, Rating.is_approved == True).all()
        return RatingsCalculator.get_score_distribution([score for (score,) in ratings])

    @staticmethod
    def get_score_distribution(scores: List[int]) -> List[Dict[str, Any]]:
        """Get distribution of overall scores in buckets of 10."""
        buckets = {f"{i}": 0 for i in range(0, 101, 10)}

        for score in scores:
            bucket = f"{int(math.floor(score / 10) * 10)}"
            if bucket in buckets:
                buckets[bucket] += 1

        return [{"score": int(k), "count": v} for k, v in buckets.items()]

    @staticmethod
    def get_sentiment_overview(db: Session, active_drop_id: int | None = None) -> Dict[str, Any]:
        """Resolve the drop to chart for admin sentiment and return its bucketed data."""
        sentiment_target_drop = None
        if active_drop_id is not None:
            sentiment_target_drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == active_drop_id).first()

        if sentiment_target_drop is None:
            sentiment_target_drop = (
                db.query(WeeklyDrop)
                .join(Rating, Rating.weekly_drop_id == WeeklyDrop.id)
                .filter(Rating.is_approved == True)
                .group_by(WeeklyDrop.id)
                .order_by(WeeklyDrop.start_date.desc())
                .first()
            )

        if sentiment_target_drop is None:
            sentiment_target_drop = db.query(WeeklyDrop).order_by(WeeklyDrop.start_date.desc()).first()

        if sentiment_target_drop is None:
            return {
                "drop_id": None,
                "movie_title": None,
                "total_ratings": 0,
                "data": [],
            }

        return {
            "drop_id": sentiment_target_drop.id,
            "movie_title": sentiment_target_drop.movie.title if sentiment_target_drop.movie else f"Drop {sentiment_target_drop.id}",
            "total_ratings": db.query(Rating)
            .filter(
                Rating.weekly_drop_id == sentiment_target_drop.id,
                Rating.is_approved == True,
            )
            .count(),
            "data": RatingsCalculator.get_sentiment_distribution(db, sentiment_target_drop.id),
        }

    @staticmethod
    def get_subcategory_insights(db: Session) -> List[Dict[str, Any]]:
        """Get fill-rate and average score for each optional sub-category."""
        categories = [
            ("Visuals", Rating.visuals_score),
            ("Story", Rating.story_score),
            ("Performances", Rating.performances_score),
            ("Sound", Rating.sound_score),
            ("Rewatchability", Rating.rewatchability_score),
            ("Enjoyment", Rating.enjoyment_score),
            ("Impact", Rating.emotional_impact_score)
        ]
        
        insights = []
        for name, col in categories:
            count = db.query(func.count(col)).filter(col.isnot(None), Rating.is_approved == True).scalar() or 0
            average = db.query(func.avg(col)).filter(col.isnot(None), Rating.is_approved == True).scalar()
            
            insights.append({
                "subject": name,
                "count": count,
                "average_score": round(float(average), 1) if average is not None else None,
                "A": count,
                "fullMark": 100
            })
            
        return insights
