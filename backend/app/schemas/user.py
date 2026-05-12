from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    use_display_name: bool = True
    show_on_leaderboard: bool = True
    public_profile: bool = False
    is_admin: bool = False
    is_active: bool = True

class UserOut(UserBase):
    id: int
    keyn_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None

class UserPreferencesUpdate(BaseModel):
    use_display_name: bool
    show_on_leaderboard: bool
    public_profile: bool

class UserProfileMovie(BaseModel):
    id: int
    title: str
    poster_path: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserProfileRating(BaseModel):
    overall_score: int
    movie: UserProfileMovie
    created_at: datetime
    weekly_drop_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class UserProfileOut(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    use_display_name: bool
    total_votes: int
    average_score: float
    recent_ratings: list[UserProfileRating]
    favorite_movies: list[UserProfileRating]
    
    class Config:
        from_attributes = True
