import { useRef, useState, type MouseEvent, type DragEvent } from "react";

export function useDraggableScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [hasDragged, setHasDragged] = useState(false);

    const handleMouseDown = (e: MouseEvent) => {
        if (!ref.current) return;
        setIsDragging(true);
        setHasDragged(false);
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);
        ref.current.style.scrollSnapType = "none";
        ref.current.style.userSelect = "none";
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.scrollSnapType = "";
            ref.current.style.userSelect = "";
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.scrollSnapType = "";
            ref.current.style.userSelect = "";
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 2;
        if (Math.abs(x - startX) > 5) {
            setHasDragged(true);
        }
        ref.current.scrollLeft = scrollLeft - walk;
    };

    const handleDragStart = (e: DragEvent) => {
        e.preventDefault();
    };

    const handleClickCapture = (e: MouseEvent) => {
        if (hasDragged) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    return {
        ref,
        onMouseDown: handleMouseDown,
        onMouseLeave: handleMouseLeave,
        onMouseUp: handleMouseUp,
        onMouseMove: handleMouseMove,
        onDragStart: handleDragStart,
        onClickCapture: handleClickCapture,
    };
}
