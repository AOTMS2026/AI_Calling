"use client";

import { buttonVariants } from "../../components/ui/Button";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { useMediaQuery } from "../../hooks/use-media-query";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";

interface PricingPlan {
    name: string;
    price: string;
    yearlyPrice: string;
    period: string;
    features: string[];
    description: string;
    buttonText: string;
    href: string;
    isPopular: boolean;
}

interface PricingProps {
    plans: PricingPlan[];
    title?: string;
    description?: string;
}

export function Pricing({
    plans,
    title = "Simple, Transparent Pricing",
    description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
    const [isMonthly, setIsMonthly] = useState(true);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const switchRef = useRef<HTMLButtonElement>(null);

    const handleToggle = (checked: boolean) => {
        setIsMonthly(!checked);
        if (checked && switchRef.current) {
            const rect = switchRef.current.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            confetti({
                particleCount: 50,
                spread: 60,
                origin: {
                    x: x / window.innerWidth,
                    y: y / window.innerHeight,
                },
                colors: [
                    "#3b82f6", // blue-500
                    "#8b5cf6", // purple-500
                    "#10b981", // emerald-500
                    "#6366f1", // indigo-500
                ],
                ticks: 200,
                gravity: 1.2,
                decay: 0.94,
                startVelocity: 30,
                shapes: ["circle"],
            });
        }
    };

    return (
        <div className="w-full py-24 sm:py-32 bg-white text-gray-900 border-t border-gray-100">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20 px-4">
                <span className="text-blue-600 font-bold tracking-widest uppercase text-xs sm:text-sm">Pricing Details</span>
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                    {title}
                </h2>
                <p className="text-gray-500 text-lg whitespace-pre-line font-medium mt-4">
                    {description}
                </p>
            </div>

            <div className="flex justify-center mb-16 items-center gap-3">
                <span className={`font-semibold ${isMonthly ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <Label>
                        <Switch
                            ref={switchRef as any}
                            checked={!isMonthly}
                            onCheckedChange={handleToggle}
                            className="relative shadow-sm"
                        />
                    </Label>
                </label>
                <span className={`font-semibold ${!isMonthly ? 'text-gray-900' : 'text-gray-400'}`}>
                    Annual billing <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full ml-1 text-sm">(Save 20%)</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
                {plans.map((plan, index) => (
                    <motion.div
                        key={index}
                        initial={{ y: 50, opacity: 1 }}
                        whileInView={
                            isDesktop
                                ? {
                                    y: plan.isPopular ? -30 : 0,
                                    opacity: 1,
                                    x: 0,
                                    scale: 1.0,
                                }
                                : {}
                        }
                        viewport={{ once: true }}
                        transition={{
                            duration: 1.6,
                            type: "spring",
                            stiffness: 100,
                            damping: 30,
                            delay: 0.1 * index,
                            opacity: { duration: 0.5 },
                        }}
                        className={cn(
                            `rounded-[2rem] p-8 lg:p-10 bg-white text-center flex flex-col justify-center relative shadow-xl transition-all duration-300`,
                            plan.isPopular
                                ? "border-blue-600 border-2 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.2)] bg-gradient-to-b from-white to-blue-50/50"
                                : "border-gray-200 border-[1px]",
                            !plan.isPopular && "mt-10 md:mt-0",
                            index === 0 || index === 2
                                ? "z-0 transform"
                                : "z-10",
                        )}
                    >
                        {plan.isPopular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 shadow-md py-1 px-4 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                                <Star className="text-white h-3.5 w-3.5 fill-current" />
                                <span className="text-white text-xs font-bold uppercase tracking-wider">
                                    Most Popular
                                </span>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <p className="text-lg font-black text-gray-900 uppercase tracking-tight">
                                {plan.name}
                            </p>

                            <div className="mt-8 mb-2 flex items-center justify-center h-[72px]">
                                <div className="flex items-start text-gray-900 tracking-tighter">
                                    <span className="text-3xl font-black mt-1 lg:mt-2 mr-1">$</span>
                                    <span className="text-6xl lg:text-7xl font-black">
                                        {isMonthly ? plan.price : plan.yearlyPrice}
                                    </span>
                                </div>
                            </div>

                            <div className="h-6 flex items-center justify-center">
                                <span className="text-sm font-bold tracking-wide text-gray-400">
                                    {plan.period !== "Next 3 months" ? `/ ${plan.period}` : ''} ({isMonthly ? "billed monthly" : "billed annually"})
                                </span>
                            </div>

                            <ul className="mt-8 mb-8 gap-4 flex flex-col text-sm font-medium text-gray-600">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-1 rounded-full mt-0.5">
                                            <Check className="h-3.5 w-3.5 text-blue-600 stroke-[3]" />
                                        </div>
                                        <span className="text-left leading-snug">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto pt-8 border-t border-gray-100">
                                <p className="text-xs font-semibold leading-relaxed text-gray-400 mb-6 min-h-[40px] flex items-center justify-center">
                                    {plan.description}
                                </p>

                                <Link
                                    to={plan.href}
                                    className={cn(
                                        "w-full py-4 px-6 rounded-xl text-base font-bold transition-all duration-300 shadow-sm block",
                                        plan.isPopular
                                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 hover:shadow-lg hover:-translate-y-0.5"
                                            : "bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200"
                                    )}
                                >
                                    {plan.buttonText}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
