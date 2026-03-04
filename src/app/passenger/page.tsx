"use client";

import React, { useState, useRef, Fragment, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { User, X, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { FaPlane, FaHotel, FaDumbbell, FaBuilding, FaUtensils, FaCoffee } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { 
    getStories,
    getPromoCountries,
    Story,
    StoryImage,
    PromoCountry
} from "@/shared/api/passenger";
import Loader from "@/shared/ui/Loader";
import { useTranslation } from "react-i18next";

const PassengerDashboardPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const user = useSelector((state: RootState) => state.user.current);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [isStoriesExpanded, setIsStoriesExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedStory, setSelectedStory] = useState<{ type: 'category' | 'partner', name: string, id?: number | string, description?: string, imageUrl?: string, storyImageUrl?: string } | null>(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [stories, setStories] = useState<Story[]>([]);
    const [loadingStories, setLoadingStories] = useState(true);
    const [countries, setCountries] = useState<PromoCountry[]>([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
    const [loadingCountries, setLoadingCountries] = useState(true);
    
    // Refs для свайпа в модалке
    const storyTouchStartX = useRef<number>(0);
    const storyTouchEndX = useRef<number>(0);
    const storyTouchStartY = useRef<number>(0);
    const storyTouchEndY = useRef<number>(0);
    const storyIsDragging = useRef<boolean>(false);
    const storyInitialDistance = useRef<number>(0);
    const storyIsPinching = useRef<boolean>(false);
    const storyWasSwiped = useRef<boolean>(false);
    const storyTouchTime = useRef<number>(0);
    const isMobileDevice = useRef<boolean>(false);
    const storyMouseMoved = useRef<boolean>(false); // Флаг движения мыши
    
    // Определяем мобильное устройство
    useEffect(() => {
        isMobileDevice.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                                 ('ontouchstart' in window) || 
                                 (navigator.maxTouchPoints > 0);
    }, []);


    // Загрузка стран из API
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                setLoadingCountries(true);
                const countriesList = await getPromoCountries();
                setCountries(countriesList);
                // Устанавливаем первую страну по умолчанию, если есть
                if (countriesList.length > 0) {
                    setSelectedCountryCode((prev) => prev || countriesList[0].code);
                }
            } catch (error) {
                console.error('Ошибка при загрузке стран:', error);
            } finally {
                setLoadingCountries(false);
            }
        };

        fetchCountries();
    }, []);

    // Загрузка stories из API
    useEffect(() => {
        if (!selectedCountryCode) return; // Не загружаем сторисы, пока не выбрана страна
        
        const fetchStories = async () => {
            try {
                setLoadingStories(true);
                const storiesData = await getStories(selectedCountryCode);
                setStories(storiesData);
            } catch (error) {
                console.error('Ошибка при загрузке stories:', error);
            } finally {
                setLoadingStories(false);
            }
        };

        fetchStories();
    }, [selectedCountryCode]);

    // Маппинг иконок для первого сториса каждого типа (категории)
    const iconComponentMap = useMemo(() => ({
        'Airline': FaPlane,
        'Hotel': FaHotel,
        'Gym': FaDumbbell,
        'Bank': FaBuilding,
        'Restaurant': FaUtensils,
        'CoffeeShop': FaCoffee,
    }), []);

    // Маппинг изображений для сторисов внутри модалки
    const storyImageMap = useMemo(() => ({
        'Airline': '/images/stories/airline-story.jpg',
        'Hotel': '/images/stories/hotel-story.jpg',
        'Gym': '/images/stories/gym-story.jpg',
        'Bank': '/images/stories/bank-story.jpg',
        'Restaurant': '/images/stories/restaurant-story.jpg',
        'CoffeeShop': '/images/stories/coffeeshop-story.jpg',
    }), []);

    // Преобразование stories из API в категории
    const categories = useMemo(() => {
        if (loadingStories || stories.length === 0) {
            // Возвращаем пустой массив или дефолтные категории во время загрузки
            return [];
        }

        // Группируем stories по businessType
        const groupedByType = stories.reduce((acc, story) => {
            const type = story.businessType || 'Other';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(story);
            return acc;
        }, {} as Record<string, Story[]>);

        // Маппинг иконок для типов бизнеса
        const iconMap: Record<string, string> = {
            'Airline': '✈️',
            'Hotel': '🏨',
            'Gym': '💪',
            'Bank': '🏦',
            'Restaurant': '🍽️',
            'CoffeeShop': '☕',
        };

        // Маппинг названий для отображения
        const nameMap: Record<string, string> = {
            'Airline': t('passenger.home.categories.airline'),
            'Hotel': t('passenger.home.categories.hotel'),
            'Gym': t('passenger.home.categories.gym'),
            'Bank': t('passenger.home.categories.bank'),
            'Restaurant': t('passenger.home.categories.restaurant'),
            'CoffeeShop': t('passenger.home.categories.coffee'),
        };

        // Преобразуем в формат категорий
        return Object.entries(groupedByType).map(([businessType, typeStories]) => {
            const icon = iconMap[businessType] || '📦';
            const displayName = nameMap[businessType] || businessType;
            return {
                name: displayName,
                icon,
                id: businessType.toLowerCase(),
                businessType: businessType,
                iconComponent: iconComponentMap[businessType as keyof typeof iconComponentMap],
                storyImageUrl: storyImageMap[businessType as keyof typeof storyImageMap],
                partners: typeStories.map((story, index) => ({
                    id: story.id,
                    name: story.name,
                    description: story.description,
                    images: story.images,
                    startDate: story.startDate,
                    endDate: story.endDate,
                    businessType: story.businessType,
                    businessLogo: story.businessLogo,
                }))
            };
        });
    }, [stories, loadingStories, iconComponentMap, storyImageMap]);

    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
    const autoSwipePaused = useRef<boolean>(false);
    
    // Синхронизация selectedCategoryIndex с количеством категорий
    useEffect(() => {
        if (categories.length > 0 && selectedCategoryIndex >= categories.length) {
            setSelectedCategoryIndex(0);
        }
    }, [categories.length, selectedCategoryIndex]);

    // Автоматический свайп каждые 2 секунды
    useEffect(() => {
        if (categories.length <= 1 || isModalOpen || autoSwipePaused.current) {
            return;
        }

        const interval = setInterval(() => {
            setDirection('up');
            setSelectedCategoryIndex((prev) => 
                prev < categories.length - 1 ? prev + 1 : 0
            );
        }, 2000);

        return () => clearInterval(interval);
    }, [categories.length, isModalOpen]);

    // Пауза автосвайпа при взаимодействии пользователя
    useEffect(() => {
        const handleUserInteraction = () => {
            autoSwipePaused.current = true;
            // Возобновляем автосвайп через 10 секунд после последнего взаимодействия
            setTimeout(() => {
                autoSwipePaused.current = false;
            }, 10000);
        };

        // Обработчики для различных типов взаимодействия
        const events = ['touchstart', 'mousedown', 'wheel', 'scroll'];
        events.forEach(event => {
            window.addEventListener(event, handleUserInteraction, { passive: true });
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserInteraction);
            });
        };
    }, []);
    const [direction, setDirection] = useState<'up' | 'down'>('up');
    const touchStartY = useRef<number>(0);
    const touchEndY = useRef<number>(0);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);
    const isDragging = useRef<boolean>(false);
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const isHorizontalScrolling = useRef<boolean>(false);
    const wasSwiped = useRef<boolean>(false); // Флаг для отслеживания свайпа
    const touchMoveDistance = useRef<number>(0); // Расстояние движения
    const hasMoved = useRef<boolean>(false); // Флаг для отслеживания реального движения
    const isClickOnBackground = useRef<boolean>(false); // Флаг для отслеживания клика на фон

    // Создаем плоский массив всех сторисов (категории + партнеры)
    const allStories = useMemo(() => {
        const storiesArray: Array<{ 
            type: 'category' | 'partner', 
            name: string, 
            id?: number | string, 
            categoryId?: string,
            description?: string,
            imageUrl?: string,
            images?: StoryImage[],
            businessType?: string,
            iconComponent?: React.ComponentType<{ className?: string; size?: number }>,
            storyImageUrl?: string
        }> = [];
        categories.forEach(category => {
            // Добавляем категорию с иконкой и изображением
            storiesArray.push({ 
                type: 'category', 
                name: category.name, 
                id: category.id,
                iconComponent: category.iconComponent,
                storyImageUrl: category.storyImageUrl,
                businessType: category.businessType
            });
            // Добавляем всех партнеров этой категории
            category.partners.forEach((partner: any) => {
                const mobileImage = partner.images?.find((img: any) => img.isMobile);
                const desktopImage = partner.images?.find((img: any) => !img.isMobile);
                const imageUrl = isMobileDevice.current && mobileImage 
                    ? mobileImage.url 
                    : (desktopImage?.url || partner.images?.[0]?.url || '');
                
                // Используем дефолтное изображение для типа бизнеса, если нет изображения
                const businessTypeKey = (partner.businessType || category.businessType) as keyof typeof storyImageMap;
                const defaultImageUrl = businessTypeKey ? storyImageMap[businessTypeKey] || '' : '';
                const finalImageUrl = imageUrl || defaultImageUrl;
                
                storiesArray.push({ 
                    type: 'partner', 
                    name: partner.name, 
                    id: partner.id, 
                    categoryId: category.id,
                    description: partner.description,
                    imageUrl: finalImageUrl,
                    images: partner.images,
                    businessType: partner.businessType || category.businessType
                });
            });
        });
        return storiesArray;
    }, [categories, storyImageMap]);

    const currentCategory = categories.length > 0 ? categories[selectedCategoryIndex] : null;
    const prevCategoryIndex = categories.length > 0 && selectedCategoryIndex > 0 ? selectedCategoryIndex - 1 : (categories.length > 0 ? categories.length - 1 : 0);
    const nextCategoryIndex = categories.length > 0 && selectedCategoryIndex < categories.length - 1 ? selectedCategoryIndex + 1 : 0;
    const prevCategory = categories.length > 0 ? categories[prevCategoryIndex] : null;
    const nextCategory = categories.length > 0 ? categories[nextCategoryIndex] : null;

    // Обработка начала касания/нажатия мыши
    const handleStart = (clientY: number, clientX: number) => {
        touchStartY.current = clientY;
        touchStartX.current = clientX;
        isDragging.current = true;
        isClickOnBackground.current = false;
    };

    // Обработка движения
    const handleMove = (clientY: number, clientX: number) => {
        if (!isDragging.current) return;
        touchEndY.current = clientY;
        touchEndX.current = clientX;
        
        // Определяем, является ли это горизонтальным свайпом
        const diffX = Math.abs(touchStartX.current - touchEndX.current);
        const diffY = Math.abs(touchStartY.current - touchEndY.current);
        
        // Если горизонтальное движение больше вертикального, считаем это горизонтальным скроллом
        if (diffX > diffY && diffX > 10) {
            isHorizontalScrolling.current = true;
        }
        
        // Если было движение, это не клик на фон
        if (diffX > 5 || diffY > 5) {
            isClickOnBackground.current = false;
        }
    };

    // Обработка окончания касания/отпускания мыши
    const handleEnd = (event?: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging.current) return;

        // Проверяем, было ли событие внутри карусели
        if (event) {
            const target = event.target as HTMLElement;
            const isInCarousel = target.closest('[data-carousel]');
            if (isInCarousel) {
                // Если событие в карусели, не обрабатываем вертикальный свайп
                isDragging.current = false;
                isHorizontalScrolling.current = false;
                touchStartY.current = 0;
                touchEndY.current = 0;
                touchStartX.current = 0;
                touchEndX.current = 0;
                return;
            }
        }

        const diffY = touchStartY.current - touchEndY.current;
        const diffX = Math.abs(touchStartX.current - touchEndX.current);
        const absDiffY = Math.abs(diffY);
        
        // Минимальная дистанция для свайпа
        const minSwipeDistance = 50;

        // Если был горизонтальный скролл, не обрабатываем вертикальный свайп
        if (!isHorizontalScrolling.current && absDiffY > diffX && absDiffY > minSwipeDistance) {
            if (diffY > 0) {
                // Свайп вверх - следующая категория
                setDirection('up');
                setSelectedCategoryIndex((prev) => 
                    prev < categories.length - 1 ? prev + 1 : 0
                );
            } else {
                // Свайп вниз - предыдущая категория
                setDirection('down');
                setSelectedCategoryIndex((prev) => 
                    prev > 0 ? prev - 1 : categories.length - 1
                );
            }
        }
        
        // Сбрасываем значения
        isDragging.current = false;
        isHorizontalScrolling.current = false;
        touchStartY.current = 0;
        touchEndY.current = 0;
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    // Touch события для мобильных устройств
    const handleTouchStart = (e: React.TouchEvent) => {
        handleStart(e.touches[0].clientY, e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Проверяем, находится ли касание внутри карусели
        const target = e.target as HTMLElement;
        const isInCarousel = target.closest('[data-carousel]');
        
        if (isInCarousel) {
            // Если касание в карусели, не обрабатываем вертикальный свайп
            return;
        }
        
        if (isDragging.current) {
            handleMove(e.touches[0].clientY, e.touches[0].clientX);
            const diffY = Math.abs(touchStartY.current - touchEndY.current);
            const diffX = Math.abs(touchStartX.current - touchEndX.current);
            // Предотвращаем дефолтное поведение только для вертикального свайпа
            // Если горизонтальное движение больше вертикального, разрешаем скролл
            if (diffY > diffX && diffY > 10 && !isHorizontalScrolling.current) {
                e.preventDefault();
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        handleEnd(e);
    };

    // Mouse события для десктопа
    const handleMouseDown = (e: React.MouseEvent) => {
        handleStart(e.clientY, e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) {
            handleMove(e.clientY, e.clientX);
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        handleEnd(e);
    };

    // Обработчики для клика на полукруги
    const handleTopSemicircleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDirection('down');
        setSelectedCategoryIndex((prev) => 
            prev > 0 ? prev - 1 : categories.length - 1
        );
    };

    const handleBottomSemicircleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDirection('up');
        setSelectedCategoryIndex((prev) => 
            prev < categories.length - 1 ? prev + 1 : 0
        );
    };

    // Обработчики свайпа для сторисов в модалке (как в мессенджерах)
    const handleStoryTouchStart = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        
        // Игнорируем кнопки и инфо блок - полностью прекращаем обработку
        if (target.closest('button') || target.closest('[data-info-block]')) {
            storyIsDragging.current = false;
            storyIsPinching.current = false;
            return;
        }
        
        // Полностью блокируем стандартное поведение
        e.preventDefault();
        e.stopPropagation();
        
        if (e.touches.length === 1) {
            storyTouchStartX.current = e.touches[0].clientX;
            storyTouchStartY.current = e.touches[0].clientY;
            storyIsDragging.current = true;
            storyIsPinching.current = false;
            storyWasSwiped.current = false;
            storyTouchTime.current = Date.now();
        } else if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            storyInitialDistance.current = distance;
            storyIsPinching.current = true;
            storyIsDragging.current = false;
            storyWasSwiped.current = true;
        }
    };

    const handleStoryTouchMove = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        
        // Игнорируем инфо блок и кнопки
        if (target.closest('[data-info-block]') || target.closest('button')) {
            return;
        }
        
        // Полностью блокируем стандартное поведение
        e.preventDefault();
        e.stopPropagation();
        
        if (e.touches.length === 1 && storyIsDragging.current && !storyIsPinching.current) {
            storyTouchEndX.current = e.touches[0].clientX;
            storyTouchEndY.current = e.touches[0].clientY;
            
            const diffX = Math.abs(storyTouchStartX.current - storyTouchEndX.current);
            const diffY = Math.abs(storyTouchStartY.current - storyTouchEndY.current);
            
            // Любое движение = жест (блокируем клик)
            if (diffX > 3 || diffY > 3) {
                storyWasSwiped.current = true;
            }
        } else if (e.touches.length === 2 && storyIsPinching.current) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            const pinchThreshold = 50;
            if (storyInitialDistance.current - currentDistance > pinchThreshold) {
                setIsModalOpen(false);
                storyIsPinching.current = false;
                storyIsDragging.current = false;
            }
        }
    };

    const handleStoryTouchEnd = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        
        // Игнорируем инфо блок и кнопки
        if (target.closest('[data-info-block]') || target.closest('button')) {
            return;
        }
        
        // Полностью блокируем стандартное поведение (включая клик)
        e.preventDefault();
        e.stopPropagation();
        
        // Если был pinch жест
        if (storyIsPinching.current) {
            storyIsPinching.current = false;
            storyIsDragging.current = false;
            storyInitialDistance.current = 0;
            storyWasSwiped.current = true;
            // Блокируем клик на долгое время после pinch
            setTimeout(() => {
                storyWasSwiped.current = false;
            }, 1000);
            return;
        }
        
        if (!storyIsDragging.current) {
            // Блокируем клик даже если не было драга
            storyWasSwiped.current = true;
            setTimeout(() => {
                storyWasSwiped.current = false;
            }, 300);
            return;
        }
        
        const diffX = storyTouchStartX.current - storyTouchEndX.current;
        const diffY = Math.abs(storyTouchStartY.current - storyTouchEndY.current);
        const absDiffX = Math.abs(diffX);
        
        const minSwipeDistance = 30;
        
        // Обработка свайпа
        if (absDiffX > diffY && absDiffX > minSwipeDistance) {
            storyWasSwiped.current = true;
            if (diffX > 0) {
                setCurrentStoryIndex((prev) => 
                    prev < allStories.length - 1 ? prev + 1 : 0
                );
            } else {
                setCurrentStoryIndex((prev) => 
                    prev > 0 ? prev - 1 : allStories.length - 1
                );
            }
        } else if (absDiffX > 3 || diffY > 3) {
            // Любое движение блокирует клик
            storyWasSwiped.current = true;
        }
        
        // Блокируем клик после любого touch события
        if (storyWasSwiped.current) {
            setTimeout(() => {
                storyWasSwiped.current = false;
            }, 800);
        }
        
        storyIsDragging.current = false;
        storyTouchStartX.current = 0;
        storyTouchEndX.current = 0;
        storyTouchStartY.current = 0;
        storyTouchEndY.current = 0;
        storyTouchTime.current = 0;
    };

    // Обработчик отмены touch события
    const handleStoryTouchCancel = (e: React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        storyIsDragging.current = false;
        storyIsPinching.current = false;
        storyWasSwiped.current = false;
        storyTouchStartX.current = 0;
        storyTouchEndX.current = 0;
        storyTouchStartY.current = 0;
        storyTouchEndY.current = 0;
        storyInitialDistance.current = 0;
    };

    // Обработчики мыши для десктопа
    const handleStoryMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Игнорируем кнопки и инфо блок
        if (target.closest('button') || target.closest('[data-info-block]')) {
            storyIsDragging.current = false;
            storyMouseMoved.current = false;
            return;
        }
        
        storyTouchStartX.current = e.clientX;
        storyTouchStartY.current = e.clientY;
        storyTouchEndX.current = e.clientX; // Инициализируем конечные координаты
        storyTouchEndY.current = e.clientY;
        storyIsDragging.current = true;
        storyMouseMoved.current = false; // Сбрасываем флаг движения
    };

    const handleStoryMouseMove = (e: React.MouseEvent) => {
        if (storyIsDragging.current) {
            storyTouchEndX.current = e.clientX;
            storyTouchEndY.current = e.clientY;
            
            // Проверяем, было ли реальное движение (больше 5px)
            const diffX = Math.abs(storyTouchStartX.current - storyTouchEndX.current);
            const diffY = Math.abs(storyTouchStartY.current - storyTouchEndY.current);
            if (diffX > 5 || diffY > 5) {
                storyMouseMoved.current = true;
            }
        }
    };

    const handleStoryMouseUp = (e: React.MouseEvent) => {
        if (!storyIsDragging.current) return;
        
        const target = e.target as HTMLElement;
        
        // Игнорируем кнопки и инфо блок - не переключаем
        if (target.closest('button') || target.closest('[data-info-block]')) {
            storyIsDragging.current = false;
            storyMouseMoved.current = false;
            storyTouchStartX.current = 0;
            storyTouchEndX.current = 0;
            storyTouchStartY.current = 0;
            storyTouchEndY.current = 0;
            return;
        }
        
        // Если не было движения мыши - это просто клик, не переключаем
        if (!storyMouseMoved.current) {
            storyIsDragging.current = false;
            storyMouseMoved.current = false;
            storyTouchStartX.current = 0;
            storyTouchEndX.current = 0;
            storyTouchStartY.current = 0;
            storyTouchEndY.current = 0;
            return;
        }
        
        const diffX = storyTouchStartX.current - storyTouchEndX.current;
        const diffY = Math.abs(storyTouchStartY.current - storyTouchEndY.current);
        const absDiffX = Math.abs(diffX);
        
        const minSwipeDistance = 50;
        
        // Переключаем только при реальном свайпе (движении), не при клике
        if (absDiffX > diffY && absDiffX > minSwipeDistance) {
            if (diffX > 0) {
                setCurrentStoryIndex((prev) => 
                    prev < allStories.length - 1 ? prev + 1 : 0
                );
            } else {
                setCurrentStoryIndex((prev) => 
                    prev > 0 ? prev - 1 : allStories.length - 1
                );
            }
        }
        
        storyIsDragging.current = false;
        storyMouseMoved.current = false;
        storyTouchStartX.current = 0;
        storyTouchEndX.current = 0;
        storyTouchStartY.current = 0;
        storyTouchEndY.current = 0;
    };

    // Обработчик клика - отключен, чтобы не переключать сторис при клике
    const handleStoryAreaClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Игнорируем кнопки и инфо блок
        if (target.closest('button') || target.closest('[data-info-block]')) {
            return;
        }
        
        // Полностью блокируем переключение при клике
        // Если была попытка переключения через клик - отменяем
        e.preventDefault();
        e.stopPropagation();
        
        // Дополнительно сбрасываем состояние
        storyIsDragging.current = false;
        storyMouseMoved.current = false;
        
        return;
    };

    // Функция для открытия модалки с определенным сторисом
    const openStoryModal = (story: { type: 'category' | 'partner', name: string, id?: number | string, categoryId?: string }) => {
        let index = -1;
        
        if (story.type === 'category') {
            // Для категории ищем по типу и id
            index = allStories.findIndex(s => 
                s.type === 'category' && s.id === story.id
            );
        } else {
            // Для партнера ищем по типу, имени и categoryId
            index = allStories.findIndex(s => 
                s.type === 'partner' && 
                s.name === story.name && 
                s.categoryId === story.categoryId
            );
        }
        
        if (index !== -1) {
            const foundStory = allStories[index];
            setCurrentStoryIndex(index);
            // Для категорий используем storyImageUrl, для партнеров - imageUrl
            const imageUrl = foundStory.type === 'category' 
                ? (foundStory.storyImageUrl || foundStory.imageUrl)
                : foundStory.imageUrl;
            setSelectedStory({ 
                type: foundStory.type, 
                name: foundStory.name, 
                id: foundStory.id,
                description: foundStory.description,
                imageUrl: imageUrl,
                storyImageUrl: foundStory.storyImageUrl
            });
            setIsModalOpen(true);
        }
    };

    // Синхронизация selectedStory с currentStoryIndex
    useEffect(() => {
        if (isModalOpen && allStories.length > 0) {
            const currentStory = allStories[currentStoryIndex];
            if (currentStory) {
                // Для категорий используем storyImageUrl, для партнеров - imageUrl
                const imageUrl = currentStory.type === 'category' 
                    ? (currentStory.storyImageUrl || currentStory.imageUrl)
                    : currentStory.imageUrl;
                setSelectedStory({ 
                    type: currentStory.type, 
                    name: currentStory.name, 
                    id: currentStory.id,
                    description: currentStory.description,
                    imageUrl: imageUrl,
                    storyImageUrl: currentStory.storyImageUrl
                });
            }
        }
    }, [currentStoryIndex, isModalOpen, allStories]);

    // Сброс флагов при закрытии модалки
    useEffect(() => {
        if (!isModalOpen) {
            storyIsDragging.current = false;
            storyIsPinching.current = false;
            storyWasSwiped.current = false;
            storyTouchStartX.current = 0;
            storyTouchEndX.current = 0;
            storyTouchStartY.current = 0;
            storyTouchEndY.current = 0;
            storyInitialDistance.current = 0;
        }
    }, [isModalOpen]);

    // Получение текущего тира
    const currentTier = useMemo(() => {
        if (user?.tier) {
            return user.tier;
        }
        return null;
    }, [user]);

    // Вспомогательная функция для получения кода/типа тира (поддержка обоих форматов)
    const getTierCode = (tier: any): string => {
        if (!tier) return '';
        // Новый формат с type
        if ('type' in tier && tier.type) {
            return tier.type.toLowerCase();
        }
        // Старый формат с code
        if ('code' in tier && tier.code) {
            return tier.code.toLowerCase();
        }
        return '';
    };

    // Функция для получения фона карточки
    const getCardBackground = () => {
        if (!currentTier) {
            return "/images/membership/bronze.jpg";
        }
        const tierCode = getTierCode(currentTier);
        const validTiers = ["bronze", "silver", "gold", "platinum"];
        if (validTiers.includes(tierCode)) {
            return `/images/membership/${tierCode}.jpg`;
        }
        return "/images/membership/bronze.jpg";
    };

    // Функция копирования в буфер обмена
    const copyToClipboard = async () => {
        const membershipId = user?.imsNumber || "—";
        try {
            await navigator.clipboard.writeText(membershipId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Функция рендера только первого элемента категории (для предпросмотра)
    const renderFirstElementOnly = (category: typeof categories[0] | null, halfPosition: 'top' | 'bottom', opacity: number = 0.4) => {
        if (!category) return null;
        return (
            <div className="w-full" style={{ opacity }}>
                <div className="flex gap-3 px-2 justify-start">
                    <div 
                        className="flex flex-col items-center gap-2 flex-shrink-0 relative"
                        style={{ 
                            minWidth: "80px",
                            height: '32px',
                            overflow: 'hidden'
                        }}
                    >
                        <div 
                            className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex flex-col items-center justify-center border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] overflow-hidden relative p-1"
                            style={halfPosition === 'top' ? { 
                                marginTop: '-32px'
                            } : {
                                marginTop: '0'
                            }}
                        >
                            {category.iconComponent ? (
                                <>
                                    <category.iconComponent className="w-5 h-5 text-white flex-shrink-0" />
                                    <span className="text-[9px] text-white font-semibold text-center leading-tight truncate w-full px-0.5 mt-0.5">
                                        {category.name}
                                    </span>
                                </>
                            ) : (
                                <span className="text-[10px] text-white text-center px-1 font-semibold leading-tight truncate w-full">
                                    {category.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Функция рендера категории
    const renderCategory = (category: typeof categories[0] | null, opacity: number = 1, showOnlyFirst: boolean = false) => {
        if (!category) return null;
        return (
            <div className="w-full" style={{ opacity }}>
                <div 
                    data-carousel="true"
                    ref={(el) => { carouselRef.current = el; }}
                    className="flex gap-3 overflow-x-auto scrollbar-hide px-2 cursor-grab active:cursor-grabbing"
                    style={{ 
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        width: '100%',
                        minWidth: '100%',
                        touchAction: 'pan-x pinch-zoom'
                    }}
                    onClick={(e) => {
                        // Открываем список при клике на пустое пространство внутри карусели
                        const target = e.target as HTMLElement;
                        // Если клик был на сам элемент карусели или на пустое пространство между элементами
                        const isClickOnStory = target.closest('[data-story-item]') || target.closest('button');
                        // Если клик был на пустое пространство (не на элементы сторисов)
                        if (!isClickOnStory) {
                            // Проверяем, что не было свайпа
                            if (!wasSwiped.current && !hasMoved.current) {
                                e.stopPropagation(); // Останавливаем распространение, чтобы не сработал родительский обработчик
                                setIsStoriesExpanded(true);
                            }
                        }
                    }}
                    onTouchStart={(e) => {
                        // Останавливаем распространение, чтобы родитель не обрабатывал событие
                        e.stopPropagation();
                        const touch = e.touches[0];
                        touchStartX.current = touch.clientX;
                        touchStartY.current = touch.clientY;
                        isHorizontalScrolling.current = false;
                        wasSwiped.current = false;
                        touchMoveDistance.current = 0;
                    }}
                    onTouchMove={(e) => {
                        // Останавливаем распространение для горизонтального движения
                        const touch = e.touches[0];
                        const diffX = Math.abs(touchStartX.current - touch.clientX);
                        const diffY = Math.abs(touchStartY.current - touch.clientY);
                        
                        // Если горизонтальное движение больше вертикального, это горизонтальный скролл
                        if (diffX > diffY && diffX > 5) {
                            isHorizontalScrolling.current = true;
                            wasSwiped.current = true; // Отмечаем, что был свайп
                            touchMoveDistance.current = diffX;
                            // Останавливаем распространение, чтобы родитель не обрабатывал вертикальный свайп
                            e.stopPropagation();
                        }
                        // Не используем preventDefault, чтобы нативная прокрутка работала
                    }}
                    onTouchEnd={(e) => {
                        // Не останавливаем распространение, чтобы дочерние элементы могли обработать
                        // Сбрасываем флаг при окончании касания через небольшую задержку
                        // чтобы onClick успел проверить флаг
                        setTimeout(() => {
                            isHorizontalScrolling.current = false;
                            // Сбрасываем флаги только если не был тап (чтобы не мешать открытию модалки)
                            if (wasSwiped.current) {
                                wasSwiped.current = false;
                                touchMoveDistance.current = 0;
                            }
                        }, 150);
                    }}
                    onMouseDown={(e) => {
                        // Для мыши не блокируем события
                        touchStartX.current = e.clientX;
                        touchStartY.current = e.clientY;
                    }}
                    onWheel={(e) => {
                        // Прокрутка колесом мыши
                        if (carouselRef.current) {
                            // Если есть горизонтальная прокрутка, используем её
                            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                                carouselRef.current.scrollLeft += e.deltaX;
                                e.preventDefault();
                                e.stopPropagation();
                            } else if (e.shiftKey) {
                                // Shift + колесо = горизонтальная прокрутка
                                carouselRef.current.scrollLeft += e.deltaY;
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }
                    }}
                >
                    {/* Название категории как первый элемент */}
                    <div 
                        data-story-item
                        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" 
                        style={{ minWidth: "80px" }}
                        onTouchStart={(e) => {
                            const touch = e.touches[0];
                            touchStartY.current = touch.clientY;
                            touchStartX.current = touch.clientX;
                            isDragging.current = true;
                            isHorizontalScrolling.current = false;
                            wasSwiped.current = false;
                            touchMoveDistance.current = 0;
                            hasMoved.current = false;
                            // Не блокируем распространение, чтобы контейнер карусели мог обработать горизонтальный скролл
                        }}
                        onTouchMove={(e) => {
                            if (!isDragging.current) return;
                            const touch = e.touches[0];
                            touchEndY.current = touch.clientY;
                            touchEndX.current = touch.clientX;
                            
                            const diffX = Math.abs(touchStartX.current - touchEndX.current);
                            const diffY = Math.abs(touchStartY.current - touchEndY.current);
                            
                            // Отмечаем, что было движение, если перемещение больше 5px
                            if (diffX > 5 || diffY > 5) {
                                hasMoved.current = true;
                            }
                            
                            // Если горизонтальное движение больше вертикального, это горизонтальный скролл
                            if (diffX > diffY && diffX > 10) {
                                isHorizontalScrolling.current = true;
                                wasSwiped.current = true;
                                touchMoveDistance.current = diffX;
                                // Не блокируем распространение - позволяем контейнеру карусели обработать горизонтальный скролл
                            } else if (diffY > diffX && diffY > 10) {
                                // Вертикальный свайп - блокируем распространение и предотвращаем дефолтное поведение
                                wasSwiped.current = true;
                                touchMoveDistance.current = diffY;
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                        onTouchEnd={(e) => {
                            if (!isDragging.current) return;
                            
                            const diffY = touchStartY.current - touchEndY.current;
                            const diffX = Math.abs(touchStartX.current - touchEndX.current);
                            const absDiffY = Math.abs(diffY);
                            
                            const minSwipeDistance = 50;
                            
                            // Если был горизонтальный скролл, не обрабатываем и не блокируем распространение
                            if (isHorizontalScrolling.current) {
                                isDragging.current = false;
                                isHorizontalScrolling.current = false;
                                hasMoved.current = false;
                                touchStartY.current = 0;
                                touchEndY.current = 0;
                                touchStartX.current = 0;
                                touchEndX.current = 0;
                                touchMoveDistance.current = 0;
                                setTimeout(() => {
                                    wasSwiped.current = false;
                                }, 150);
                                return; // Не блокируем распространение для горизонтального скролла
                            }
                            
                            // Если был реальный вертикальный свайп (было движение и достаточное расстояние), переключаем категории
                            if (hasMoved.current && absDiffY > diffX && absDiffY > minSwipeDistance) {
                                if (diffY > 0) {
                                    // Свайп вверх - следующая категория
                                    setDirection('up');
                                    setSelectedCategoryIndex((prev) => 
                                        prev < categories.length - 1 ? prev + 1 : 0
                                    );
                                } else {
                                    // Свайп вниз - предыдущая категория
                                    setDirection('down');
                                    setSelectedCategoryIndex((prev) => 
                                        prev > 0 ? prev - 1 : categories.length - 1
                                    );
                                }
                                wasSwiped.current = true;
                                e.preventDefault();
                                e.stopPropagation();
                            } else if (!hasMoved.current || (!wasSwiped.current && touchMoveDistance.current <= 10)) {
                                // Если не было движения (просто клик), открываем модалку
                                e.preventDefault();
                                e.stopPropagation();
                                openStoryModal({ type: 'category', name: category.name, id: category.id });
                            }
                            
                            // Сбрасываем значения
                            isDragging.current = false;
                            isHorizontalScrolling.current = false;
                            hasMoved.current = false;
                            touchStartY.current = 0;
                            touchEndY.current = 0;
                            touchStartX.current = 0;
                            touchEndX.current = 0;
                            touchMoveDistance.current = 0;
                            
                            // Сбрасываем флаг через небольшую задержку
                            setTimeout(() => {
                                wasSwiped.current = false;
                            }, 150);
                        }}
                        onMouseDown={(e) => {
                            touchStartY.current = e.clientY;
                            touchStartX.current = e.clientX;
                            isDragging.current = true;
                            isHorizontalScrolling.current = false;
                            wasSwiped.current = false;
                            touchMoveDistance.current = 0;
                            hasMoved.current = false;
                            e.stopPropagation();
                        }}
                        onMouseMove={(e) => {
                            if (isDragging.current) {
                                touchEndY.current = e.clientY;
                                touchEndX.current = e.clientX;
                                
                                const diffX = Math.abs(touchStartX.current - touchEndX.current);
                                const diffY = Math.abs(touchStartY.current - touchEndY.current);
                                
                                // Отмечаем, что было движение, если перемещение больше 5px
                                if (diffX > 5 || diffY > 5) {
                                    hasMoved.current = true;
                                }
                                
                                if (diffX > diffY && diffX > 10) {
                                    isHorizontalScrolling.current = true;
                                } else if (diffY > diffX && diffY > 5) {
                                    wasSwiped.current = true;
                                    touchMoveDistance.current = diffY;
                                }
                            }
                        }}
                        onMouseUp={(e) => {
                            if (!isDragging.current) return;
                            
                            const diffY = touchStartY.current - touchEndY.current;
                            const diffX = Math.abs(touchStartX.current - touchEndX.current);
                            const absDiffY = Math.abs(diffY);
                            
                            const minSwipeDistance = 50;
                            
                            // Если был реальный вертикальный свайп (было движение и достаточное расстояние), переключаем категории
                            if (hasMoved.current && !isHorizontalScrolling.current && absDiffY > diffX && absDiffY > minSwipeDistance) {
                                if (diffY > 0) {
                                    // Свайп вверх - следующая категория
                                    setDirection('up');
                                    setSelectedCategoryIndex((prev) => 
                                        prev < categories.length - 1 ? prev + 1 : 0
                                    );
                                } else {
                                    // Свайп вниз - предыдущая категория
                                    setDirection('down');
                                    setSelectedCategoryIndex((prev) => 
                                        prev > 0 ? prev - 1 : categories.length - 1
                                    );
                                }
                            } else if (!hasMoved.current || (!wasSwiped.current && touchMoveDistance.current <= 10)) {
                                // Если не было движения (просто клик), открываем модалку
                                openStoryModal({ type: 'category', name: category.name, id: category.id });
                            }
                            
                            // Сбрасываем значения
                            isDragging.current = false;
                            isHorizontalScrolling.current = false;
                            hasMoved.current = false;
                            touchStartY.current = 0;
                            touchEndY.current = 0;
                            touchStartX.current = 0;
                            touchEndX.current = 0;
                            touchMoveDistance.current = 0;
                            
                            setTimeout(() => {
                                wasSwiped.current = false;
                            }, 150);
                            
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            // Для мыши/десктопа - только если не было движения (просто клик)
                            if (!hasMoved.current && !wasSwiped.current) {
                                e.stopPropagation();
                                openStoryModal({ type: 'category', name: category.name, id: category.id });
                            }
                        }}
                    >
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex flex-col items-center justify-center border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] cursor-pointer hover:border-white/35 hover:bg-white/15 transition-all overflow-hidden relative p-1">
                            {category.iconComponent ? (
                                <>
                                    <category.iconComponent className="w-5 h-5 text-white flex-shrink-0" />
                                    <span className="text-[9px] text-white font-semibold text-center leading-tight truncate w-full px-0.5 mt-0.5">
                                        {category.name}
                                    </span>
                                </>
                            ) : (
                                <span className="text-[10px] text-white text-center px-1 font-semibold leading-tight truncate w-full">
                                    {category.name}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Логотипы партнеров */}
                    {!showOnlyFirst && category.partners.map((partner) => (
                        <div
                            key={partner.id}
                            data-story-item
                            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                            style={{ minWidth: "80px" }}
                            onTouchStart={(e) => {
                                const touch = e.touches[0];
                                touchStartY.current = touch.clientY;
                                touchStartX.current = touch.clientX;
                                isDragging.current = true;
                                isHorizontalScrolling.current = false;
                                wasSwiped.current = false;
                                touchMoveDistance.current = 0;
                                hasMoved.current = false;
                                // Не блокируем распространение, чтобы контейнер карусели мог обработать горизонтальный скролл
                            }}
                            onTouchMove={(e) => {
                                if (!isDragging.current) return;
                                const touch = e.touches[0];
                                touchEndY.current = touch.clientY;
                                touchEndX.current = touch.clientX;
                                
                                const diffX = Math.abs(touchStartX.current - touchEndX.current);
                                const diffY = Math.abs(touchStartY.current - touchEndY.current);
                                
                                // Отмечаем, что было движение, если перемещение больше 5px
                                if (diffX > 5 || diffY > 5) {
                                    hasMoved.current = true;
                                }
                                
                                // Если горизонтальное движение больше вертикального, это горизонтальный скролл
                                if (diffX > diffY && diffX > 10) {
                                    isHorizontalScrolling.current = true;
                                    wasSwiped.current = true;
                                    touchMoveDistance.current = diffX;
                                    // Не блокируем распространение - позволяем контейнеру карусели обработать горизонтальный скролл
                                } else if (diffY > diffX && diffY > 10) {
                                    // Вертикальный свайп - блокируем распространение и предотвращаем дефолтное поведение
                                    wasSwiped.current = true;
                                    touchMoveDistance.current = diffY;
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }}
                            onTouchEnd={(e) => {
                                if (!isDragging.current) return;
                                
                                const diffY = touchStartY.current - touchEndY.current;
                                const diffX = Math.abs(touchStartX.current - touchEndX.current);
                                const absDiffY = Math.abs(diffY);
                                
                                const minSwipeDistance = 50;
                                
                                // Если был горизонтальный скролл, не обрабатываем и не блокируем распространение
                                if (isHorizontalScrolling.current) {
                                    isDragging.current = false;
                                    isHorizontalScrolling.current = false;
                                    hasMoved.current = false;
                                    touchStartY.current = 0;
                                    touchEndY.current = 0;
                                    touchStartX.current = 0;
                                    touchEndX.current = 0;
                                    touchMoveDistance.current = 0;
                                    setTimeout(() => {
                                        wasSwiped.current = false;
                                    }, 150);
                                    return; // Не блокируем распространение для горизонтального скролла
                                }
                                
                                // Если был реальный вертикальный свайп (было движение и достаточное расстояние), переключаем категории
                                if (hasMoved.current && absDiffY > diffX && absDiffY > minSwipeDistance) {
                                    if (diffY > 0) {
                                        // Свайп вверх - следующая категория
                                        setDirection('up');
                                        setSelectedCategoryIndex((prev) => 
                                            prev < categories.length - 1 ? prev + 1 : 0
                                        );
                                    } else {
                                        // Свайп вниз - предыдущая категория
                                        setDirection('down');
                                        setSelectedCategoryIndex((prev) => 
                                            prev > 0 ? prev - 1 : categories.length - 1
                                        );
                                    }
                                    wasSwiped.current = true;
                                    e.preventDefault();
                                    e.stopPropagation();
                                } else if (!hasMoved.current || (!wasSwiped.current && touchMoveDistance.current <= 10)) {
                                    // Если не было движения (просто клик), открываем модалку
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openStoryModal({ type: 'partner', name: partner.name, id: partner.id, categoryId: category.id });
                                }
                                
                                // Сбрасываем значения
                                isDragging.current = false;
                                isHorizontalScrolling.current = false;
                                hasMoved.current = false;
                                touchStartY.current = 0;
                                touchEndY.current = 0;
                                touchStartX.current = 0;
                                touchEndX.current = 0;
                                touchMoveDistance.current = 0;
                                
                                // Сбрасываем флаг через небольшую задержку
                                setTimeout(() => {
                                    wasSwiped.current = false;
                                }, 150);
                            }}
                            onMouseDown={(e) => {
                                touchStartY.current = e.clientY;
                                touchStartX.current = e.clientX;
                                isDragging.current = true;
                                isHorizontalScrolling.current = false;
                                wasSwiped.current = false;
                                touchMoveDistance.current = 0;
                                hasMoved.current = false;
                                e.stopPropagation();
                            }}
                            onMouseMove={(e) => {
                                if (isDragging.current) {
                                    touchEndY.current = e.clientY;
                                    touchEndX.current = e.clientX;
                                    
                                    const diffX = Math.abs(touchStartX.current - touchEndX.current);
                                    const diffY = Math.abs(touchStartY.current - touchEndY.current);
                                    
                                    // Отмечаем, что было движение, если перемещение больше 5px
                                    if (diffX > 5 || diffY > 5) {
                                        hasMoved.current = true;
                                    }
                                    
                                    if (diffX > diffY && diffX > 10) {
                                        isHorizontalScrolling.current = true;
                                    } else if (diffY > diffX && diffY > 5) {
                                        wasSwiped.current = true;
                                        touchMoveDistance.current = diffY;
                                    }
                                }
                            }}
                            onMouseUp={(e) => {
                                if (!isDragging.current) return;
                                
                                const diffY = touchStartY.current - touchEndY.current;
                                const diffX = Math.abs(touchStartX.current - touchEndX.current);
                                const absDiffY = Math.abs(diffY);
                                
                                const minSwipeDistance = 50;
                                
                                // Если был реальный вертикальный свайп (было движение и достаточное расстояние), переключаем категории
                                if (hasMoved.current && !isHorizontalScrolling.current && absDiffY > diffX && absDiffY > minSwipeDistance) {
                                    if (diffY > 0) {
                                        // Свайп вверх - следующая категория
                                        setDirection('up');
                                        setSelectedCategoryIndex((prev) => 
                                            prev < categories.length - 1 ? prev + 1 : 0
                                        );
                                    } else {
                                        // Свайп вниз - предыдущая категория
                                        setDirection('down');
                                        setSelectedCategoryIndex((prev) => 
                                            prev > 0 ? prev - 1 : categories.length - 1
                                        );
                                    }
                                } else if (!hasMoved.current || (!wasSwiped.current && touchMoveDistance.current <= 10)) {
                                    // Если не было движения (просто клик), открываем модалку
                                    openStoryModal({ type: 'partner', name: partner.name, id: partner.id, categoryId: category.id });
                                }
                                
                                // Сбрасываем значения
                                isDragging.current = false;
                                isHorizontalScrolling.current = false;
                                hasMoved.current = false;
                                touchStartY.current = 0;
                                touchEndY.current = 0;
                                touchStartX.current = 0;
                                touchEndX.current = 0;
                                touchMoveDistance.current = 0;
                                
                                setTimeout(() => {
                                    wasSwiped.current = false;
                                }, 150);
                                
                                e.stopPropagation();
                            }}
                            onClick={(e) => {
                                // Для мыши/десктопа - только если не было движения (просто клик)
                                if (!hasMoved.current && !wasSwiped.current) {
                                    e.stopPropagation();
                                    openStoryModal({ type: 'partner', name: partner.name, id: partner.id, categoryId: category.id });
                                }
                            }}
                        >
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] cursor-pointer hover:border-white/35 hover:bg-white/15 transition-all overflow-hidden relative">
                                {partner.businessLogo ? (
                                    <Image
                                        src={partner.businessLogo}
                                        alt={partner.name}
                                        fill
                                        className="object-cover rounded-full"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-xs text-gray-800 font-medium">Logo</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Варианты анимации для framer-motion - вертикальное движение с плавным затуханием
    const slideVariants = {
        enter: (direction: 'up' | 'down') => ({
            y: direction === 'up' ? 110 : -110,  // Высота контейнера в пикселях
            opacity: 0
        }),
        center: {
            zIndex: 1,
            y: 0,
            opacity: 1
        },
        exit: (direction: 'up' | 'down') => ({
            zIndex: 0,
            y: direction === 'up' ? -110 : 110,  // Высота контейнера в пикселях
            opacity: 0
        })
    };

    return (
        <div className="relative min-h-screen">
            <div className="flex flex-col min-h-screen">
            {/* Header с логотипом и "Kazakhstan" */}
            <header className="bg-background-dark px-4 pt-3 pb-3">
                <div className="flex justify-between items-center">
                    <Link href="/passenger" className="flex items-center gap-2 cursor-pointer">
                        <Image
                            src="/images/logo.png"
                            alt="IMS Savvy"
                            width={135}
                            height={30}
                            priority
                        />
                    </Link>
                    <select
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-md border border-white/20 text-xs font-medium text-white outline-none cursor-pointer hover:bg-white/15 hover:border-white/35 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)] appearance-none pr-8"
                        disabled={loadingCountries}
                        style={{
                            backgroundImage: loadingCountries ? 'none' : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'white\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                            paddingRight: '32px'
                        }}
                    >
                        {loadingCountries ? (
                            <option value="" style={{ color: '#000' }}>{t("passenger.home.loading")}</option>
                        ) : (
                            countries.map((country) => (
                                <option key={country.code} value={country.code} style={{ color: '#000' }}>
                                    {country.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </header>

            {/* Основной контент с кнопками */}
            <div className="flex-1 space-y-4 relative min-h-0">
                {/* Фоновое изображение */}
                <div className="absolute inset-0 -z-10">
                    <Image
                        src="/images/passengersbg.png"
                        alt="Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Затемняющий overlay для читаемости */}
                    <div className="absolute inset-0 bg-black/45" />
                </div>

                <div className="max-w-[600px] mx-auto w-full">
                    {/* Горизонтальный список с названием категории первым элементом */}
                    {loadingStories ? (
                        <div className="flex flex-col items-center gap-4 overflow-hidden relative select-none mb-6" style={{ minHeight: '110px' }}>
                            <Loader text={t("passenger.home.loading")} textColor="text-label-white" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 overflow-hidden relative select-none mb-6" style={{ minHeight: '110px' }}>
                            <div className="text-white">{t("passenger.home.noStories")}</div>
                        </div>
                    ) : (
                        <motion.div 
                            className="flex flex-col items-center gap-4 overflow-hidden relative select-none mb-6 cursor-pointer" 
                            initial={false}
                            animate={{ 
                                minHeight: isStoriesExpanded ? 'auto' : '110px',
                                maxHeight: isStoriesExpanded ? '70vh' : '110px'
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{ 
                                overflow: isStoriesExpanded ? 'auto' : 'hidden'
                            }}
                            onTouchStart={(e) => {
                                // Проверяем, клик ли это на пустое пространство (между сторисами или на фон)
                                const target = e.target as HTMLElement;
                                // Клик на элемент сториса или кнопку - не открываем список
                                const isClickOnStory = target.closest('button') ||
                                                       target.closest('[data-story-item]');
                                // Клик на пустое пространство внутри карусели (между сторисами) - открываем список
                                const isClickOnCarouselBackground = target.closest('[data-carousel]') && !isClickOnStory;
                                // Клик на фон вне карусели - открываем список
                                const isClickOnOutside = !target.closest('[data-carousel]') && !isClickOnStory;
                                
                                if (isClickOnCarouselBackground || isClickOnOutside) {
                                    isClickOnBackground.current = true;
                                } else {
                                    isClickOnBackground.current = false;
                                }
                                // Вызываем оригинальный обработчик
                                handleTouchStart(e);
                            }}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={(e) => {
                                // Вызываем оригинальный обработчик
                                handleTouchEnd(e);
                                // Проверяем, был ли это клик на пустое пространство (без движения)
                                if (isClickOnBackground.current && !wasSwiped.current && !hasMoved.current) {
                                    const target = e.target as HTMLElement;
                                    const isClickOnStory = target.closest('button') ||
                                                           target.closest('[data-story-item]');
                                    const isClickOnCarouselBackground = target.closest('[data-carousel]') && !isClickOnStory;
                                    const isClickOnOutside = !target.closest('[data-carousel]') && !isClickOnStory;
                                    
                                    if (isClickOnCarouselBackground || isClickOnOutside) {
                                        setIsStoriesExpanded(true);
                                    }
                                }
                                isClickOnBackground.current = false;
                            }}
                            onMouseDown={(e) => {
                                // Проверяем, клик ли это на пустое пространство (между сторисами или на фон)
                                const target = e.target as HTMLElement;
                                // Клик на элемент сториса или кнопку - не открываем список
                                const isClickOnStory = target.closest('button') ||
                                                       target.closest('[data-story-item]');
                                // Клик на пустое пространство внутри карусели (между сторисами) - открываем список
                                const isClickOnCarouselBackground = target.closest('[data-carousel]') && !isClickOnStory;
                                // Клик на фон вне карусели - открываем список
                                const isClickOnOutside = !target.closest('[data-carousel]') && !isClickOnStory;
                                
                                if (isClickOnCarouselBackground || isClickOnOutside) {
                                    isClickOnBackground.current = true;
                                } else {
                                    isClickOnBackground.current = false;
                                }
                                // Вызываем оригинальный обработчик
                                handleMouseDown(e);
                            }}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onClick={(e) => {
                                // Открываем список сторисов при клике на пустое пространство (между сторисами или на фон)
                                const target = e.target as HTMLElement;
                                const isClickOnStory = target.closest('button') ||
                                                       target.closest('[data-story-item]');
                                const isClickOnCarouselBackground = target.closest('[data-carousel]') && !isClickOnStory;
                                const isClickOnOutside = !target.closest('[data-carousel]') && !isClickOnStory;
                                
                                if ((isClickOnCarouselBackground || isClickOnOutside) && isClickOnBackground.current && !wasSwiped.current && !hasMoved.current) {
                                    setIsStoriesExpanded(true);
                                }
                                isClickOnBackground.current = false;
                            }}
                        >
                            {!isStoriesExpanded ? (
                            <>
                            {/* Контейнер с вертикальной анимацией движения снизу вверх */}
                            <div 
                                className="w-full relative overflow-hidden flex items-center" 
                                style={{ height: '110px' }}
                                onClick={(e) => {
                                    // Открываем список при клике на пустое пространство (не на кнопки-полукруги)
                                    const target = e.target as HTMLElement;
                                    // Если клик был на сам контейнер или на motion.div, но не на кнопки
                                    if (!target.closest('button') && !target.closest('[data-story-item]') && !target.closest('[data-carousel]')) {
                                        if (!wasSwiped.current && !hasMoved.current) {
                                            setIsStoriesExpanded(true);
                                        }
                                    }
                                }}
                            >
                                {/* Контейнер для всех трех категорий - все двигаются вместе */}
                                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                            <motion.div
                                key={selectedCategoryIndex}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    y: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.3, ease: "easeOut" }
                                }}
                                className="w-full absolute"
                                style={{ 
                                    top: 0,
                                    left: 0,
                                    right: 0
                                }}
                                onClick={(e) => {
                                    // Открываем список при клике на пустое пространство
                                    const target = e.target as HTMLElement;
                                    // Если клик был на motion.div или его дочерние элементы, но не на кнопки и не на элементы сторисов
                                    if (!target.closest('button') && 
                                        !target.closest('[data-story-item]') && 
                                        !target.closest('[data-carousel]')) {
                                        if (!wasSwiped.current && !hasMoved.current) {
                                            setIsStoriesExpanded(true);
                                        }
                                    }
                                }}
                            >
                                {/* Предыдущая категория (верхняя часть, видно только нижние 24px) */}
                                <div 
                                    className="w-full absolute"
                                    style={{ 
                                        top: '-94px',
                                        height: '72px'
                                    }}
                                >
                                    <div 
                                        className="relative"
                                        style={{ 
                                            opacity: 0.4,
                                            pointerEvents: 'none',
                                            transform: 'translateY(40px)',
                                            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 60%, black 80%, black 100%)',
                                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 60%, black 80%, black 100%)'
                                        }}
                                    >
                                        {renderCategory(prevCategory, 1, true)}
                                    </div>
                                </div>
                                
                                {/* Кликабельный верхний полукруг (видимая нижняя часть) - позиционирован в видимой области */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTopSemicircleClick(e);
                                    }}
                                    className="absolute cursor-pointer hover:bg-white/5 transition-colors"
                                    style={{
                                        top: '0px',
                                        left: 0,
                                        right: 0,
                                        height: '24px',
                                        zIndex: 20,
                                        pointerEvents: 'auto',
                                    }}
                                    aria-label="Swipe down to previous category"
                                />

                                {/* Текущая категория (центральная часть, полностью видна) */}
                                <div 
                                    className="w-full absolute flex items-center"
                                    style={{ 
                                        top: '24px',
                                        height: '72px',
                                        pointerEvents: 'auto',
                                    }}
                                    onClick={(e) => {
                                        // Открываем список при клике на пустое пространство в центральной области
                                        const target = e.target as HTMLElement;
                                        // Если клик был на карусель, но не на элементы сторисов и не на кнопки
                                        const isClickOnStory = target.closest('[data-story-item]') || target.closest('button');
                                        if (target.closest('[data-carousel]') && !isClickOnStory) {
                                            if (!wasSwiped.current && !hasMoved.current) {
                                                e.stopPropagation();
                                                setIsStoriesExpanded(true);
                                            }
                                        }
                                    }}
                                >
                                    {renderCategory(currentCategory, 1)}
                                </div>

                                {/* Следующая категория (нижняя часть, видно только верхние 24px) */}
                                <div 
                                    className="w-full absolute"
                                    style={{ 
                                        top: '100px',
                                        height: '72px'
                                    }}
                                >
                                    <div 
                                        className="relative"
                                        style={{ 
                                            opacity: 0.4,
                                            pointerEvents: 'none',
                                            transform: 'translateY(0)',
                                            maskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 60%, black 80%, black 100%)',
                                            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 60%, black 80%, black 100%)'
                                        }}
                                    >
                                        {renderCategory(nextCategory, 1, true)}
                                    </div>
                                    {/* Кликабельный нижний полукруг (видимая верхняя часть) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBottomSemicircleClick(e);
                                        }}
                                        className="absolute cursor-pointer hover:bg-white/5 transition-colors"
                                        style={{
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '24px',
                                            zIndex: 20,
                                            pointerEvents: 'auto',
                                        }}
                                        aria-label="Swipe up to next category"
                                    />
                                </div>
                            </motion.div>
                                </AnimatePresence>
                                {/* Стрелочка для раскрытия */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                                    <ChevronDown className="h-5 w-5 text-white/60" />
                                </div>
                            </div>
                            </>
                            ) : (
                                // Расширенный список всех сторисов
                                <div className="pt-7 w-full relative z-10 flex flex-col" style={{ minHeight: '200px' }}> 

                                <div className="absolute right-0 top-12 flex justify-end px-2 items-center">
                                        {/* Стрелочка для сворачивания */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsStoriesExpanded(false);
                                            }}
                                            className="p-1.5 rounded-full transition-colors flex items-center justify-center"
                                            aria-label="Свернуть"
                                        >
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                                                <ChevronUp className="h-5 w-5 text-white/60" />
                                            </div>
                                        </button>
                                    </div>   
                                    <div 
                                        className="space-y-6 max-h-[37vh] overflow-y-auto scrollbar-hide"
                                        style={{
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none',
                                        }}
                                    >
                                        {categories.length === 0 ? (
                                            <div className="text-center py-8 text-white/70">
                                                {t("passenger.home.noStories")}
                                            </div>
                                        ) : (
                                        categories.map((category) => (
                                            <div key={category.id} className="space-y-3">
                                                <div 
                                                    data-carousel="true"
                                                    className="flex gap-3 overflow-x-auto scrollbar-hide px-2"
                                                    style={{ 
                                                        scrollBehavior: 'smooth',
                                                        WebkitOverflowScrolling: 'touch',
                                                        scrollbarWidth: 'none',
                                                        msOverflowStyle: 'none',
                                                    }}
                                                >
                                                    {/* Категория как первый элемент */}
                                                    <div 
                                                        data-story-item
                                                        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                                                        style={{ minWidth: "80px" }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openStoryModal({ type: 'category', name: category.name, id: category.id });
                                                            setIsStoriesExpanded(false);
                                                        }}
                                                    >
                                                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex flex-col items-center justify-center border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] overflow-hidden relative p-1">
                                                            {category.iconComponent ? (
                                                                <>
                                                                    <category.iconComponent className="w-5 h-5 text-white flex-shrink-0" />
                                                                    <span className="text-[9px] text-white font-semibold text-center leading-tight truncate w-full px-0.5 mt-0.5">
                                                                        {category.name}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] text-white text-center px-1 font-semibold leading-tight truncate w-full">
                                                                    {category.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Партнеры категории */}
                                                    {category.partners.map((partner) => (
                                                        <div
                                                            key={partner.id}
                                                            data-story-item
                                                            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                                                            style={{ minWidth: "80px" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openStoryModal({ type: 'partner', name: partner.name, id: partner.id, categoryId: category.id });
                                                                setIsStoriesExpanded(false);
                                                            }}
                                                        >
                                                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] cursor-pointer hover:border-white/35 hover:bg-white/15 transition-all overflow-hidden relative">
                                                                {partner.businessLogo ? (
                                                                    <Image
                                                                        src={partner.businessLogo}
                                                                        alt={partner.name}
                                                                        fill
                                                                        className="object-cover rounded-full"
                                                                        unoptimized
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-gray-800 font-medium">Logo</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                {/* Две главные кнопки */}
                <div className="flex space-x-6 justify-center max-w-md mx-auto relative z-10">
                    {/* My Account */}
                    <button
                        onClick={() => router.push("/passenger/account")}
                        className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl 
                        p-4 flex flex-col items-center justify-center gap-2 hover:border-white/35 hover:bg-white/15
                        transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)] cursor-pointer w-[160px] max-w-[200px]"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-sm text-white">{t("passenger.home.myAccount")}</div>
                        </div>
                    </button>

                    {/* Book a Trip */}
                    <button
                        onClick={() => router.push("/passenger/trips")}
                        className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl 
                        p-4 flex flex-col items-center justify-center gap-2 hover:border-white/35 hover:bg-white/15
                        transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)] cursor-pointer w-[160px] max-w-[200px]"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
                            <FaPlane className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-sm text-white">{t("passenger.home.bookATrip")}</div>
                        </div>
                    </button>
                </div>
                </div>
            </div>
            </div>

            {/* Модальное окно для stories - на весь экран */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog 
                    as="div" 
                    className="relative z-50" 
                    onClose={() => {
                        // Просто закрываем модалку, не переключаем сторис
                        setIsModalOpen(false);
                    }}
                    static
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-hidden">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Dialog.Panel 
                                className="w-full h-screen bg-black flex flex-col relative"
                                style={{ touchAction: 'none', userSelect: 'none' }}
                            >
                                <div
                                    className="w-full h-full flex flex-col relative"
                                    style={{ touchAction: 'none' }}
                                    onTouchStart={handleStoryTouchStart}
                                    onTouchMove={handleStoryTouchMove}
                                    onTouchEnd={handleStoryTouchEnd}
                                    onTouchCancel={handleStoryTouchCancel}
                                    onMouseDown={handleStoryMouseDown}
                                    onMouseMove={handleStoryMouseMove}
                                    onMouseUp={handleStoryMouseUp}
                                    onMouseLeave={(e) => {
                                        // При уходе мыши сбрасываем состояние без переключения
                                        storyIsDragging.current = false;
                                        storyMouseMoved.current = false;
                                        storyTouchStartX.current = 0;
                                        storyTouchEndX.current = 0;
                                        storyTouchStartY.current = 0;
                                        storyTouchEndY.current = 0;
                                    }}
                                    onClick={handleStoryAreaClick}
                                >
                                {/* Кнопка закрытия */}
                                <div className="flex justify-end p-4 absolute top-0 right-0 z-20" style={{ touchAction: 'auto', pointerEvents: 'auto' }}>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsModalOpen(false);
                                        }}
                                        onTouchStart={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onTouchMove={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onTouchEnd={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsModalOpen(false);
                                        }}
                                        className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <X className="h-6 w-6 text-white" />
                                    </button>
                                </div>

                                {/* Изображение - 70% высоты */}
                                {selectedStory && (
                                    <div className="relative w-full flex-[0_0_70%] overflow-hidden">
                                        <div className="absolute inset-0">
                                            {selectedStory.imageUrl ? (
                                                <Image
                                                    src={selectedStory.imageUrl}
                                                    alt={selectedStory.name}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                    unoptimized
                                                />
                                            ) : (
                                                <Image
                                                    src="/images/passengersbg.png"
                                                    alt={selectedStory.name}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                />
                                            )}
                                        </div>
                                        {/* Name и Description поверх изображения внизу */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-6 py-4">
                                            <div className="max-w-[600px] mx-auto w-full">
                                                {selectedStory.description && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setIsDescriptionModalOpen(true);
                                                        }}
                                                        className="text-white/90 text-sm hover:text-white underline cursor-pointer text-left"
                                                        style={{ touchAction: 'auto' }}
                                                        onTouchStart={(e) => e.stopPropagation()}
                                                        onTouchMove={(e) => e.stopPropagation()}
                                                        onTouchEnd={(e) => {
                                                            e.stopPropagation();
                                                            setIsDescriptionModalOpen(true);
                                                        }}
                                                    >
                                                        {t('passenger.home.readMore')}
                                                    </button>
                                                )}
                                                {!selectedStory.description && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setIsDescriptionModalOpen(true);
                                                        }}
                                                        className="text-white/90 text-sm hover:text-white underline cursor-pointer text-left"
                                                        style={{ touchAction: 'auto' }}
                                                        onTouchStart={(e) => e.stopPropagation()}
                                                        onTouchMove={(e) => e.stopPropagation()}
                                                        onTouchEnd={(e) => {
                                                            e.stopPropagation();
                                                            setIsDescriptionModalOpen(true);
                                                        }}
                                                    >
                                                        {selectedStory.type === 'category' 
                                                            ? t("passenger.home.categoryDescription", { name: selectedStory.name })
                                                            : t("passenger.home.partnerDescription", { name: selectedStory.name })
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Инфо блок снизу - 30% высоты */}
                                {selectedStory && (
                                    <div 
                                        data-info-block
                                        className="bg-white/90 backdrop-blur-sm border-t border-white/30 px-6 py-4 flex-[0_0_30%] flex flex-col justify-start overflow-y-auto"
                                        style={{ touchAction: 'auto' }}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onTouchMove={(e) => e.stopPropagation()}
                                        onTouchEnd={(e) => e.stopPropagation()}
                                    >
                                        <div className="max-w-[600px] mx-auto w-full">
                                            {/* Transactions Text */}
                                            <div className="text-center">
                                                <h2 className="text-lg text-gray-900">
                                                    Transactions
                                                </h2>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>

            {/* Модальное окно для полного описания */}
            <Transition appear show={isDescriptionModalOpen} as={Fragment}>
                <Dialog 
                    as="div" 
                    className="relative z-50" 
                    onClose={() => setIsDescriptionModalOpen(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-semibold leading-6 text-gray-900"
                                        >
                                            {selectedStory?.name}
                                        </Dialog.Title>
                                        <button
                                            onClick={() => setIsDescriptionModalOpen(false)}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <X className="h-5 w-5 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {selectedStory?.description || (
                                                selectedStory?.type === 'category' 
                                                    ? t("passenger.home.categoryDescription", { name: selectedStory?.name || '' })
                                                    : t("passenger.home.partnerDescription", { name: selectedStory?.name || '' })
                                            )}
                                        </p>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

        </div>
    );
};

export default PassengerDashboardPage;
