import React from 'react';

export const Swiper = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="swiper-mock">{children}</div>
);
export const SwiperSlide = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="swiper-slide-mock">{children}</div>
);
export const Navigation = () => null;
export const Pagination = () => null;
