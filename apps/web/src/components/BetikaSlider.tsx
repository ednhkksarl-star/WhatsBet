"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Betika images from internet
const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?q=80&w=1920&auto=format&fit=crop",
    title: "Parier en direct",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1920&auto=format&fit=crop",
    title: "Cotes attractives",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1920&auto=format&fit=crop",
    title: "Vos gains instantanés",
  },
];

export function BetikaSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  function nextSlide() {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }

  function prevSlide() {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }

  useEffect(() => {
    intervalRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-12">
      <div className="relative h-64 overflow-hidden rounded-2xl border border-brand-blue-700 md:h-80">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <h3 className="text-2xl font-bold text-brand-yellow-500">{slide.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-brand-blue-900/80 p-2 text-white hover:bg-brand-yellow-500 hover:text-brand-blue-900 transition z-10"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-brand-blue-900/80 p-2 text-white hover:bg-brand-yellow-500 hover:text-brand-blue-900 transition z-10"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? "w-6 bg-brand-yellow-500" : "w-2 bg-brand-blue-700"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
