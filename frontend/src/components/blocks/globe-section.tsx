import { GlobeCdn } from '../ui/cobe-globe-cdn';

export function GlobeSection() {
    return (
        <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-32 lg:py-48 relative z-10 border-t border-gray-100 overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
                {/* Left Text Content */}
                <div className="flex-1 w-full text-center lg:text-left z-20">
                    <span className="text-blue-600 font-bold tracking-widest uppercase text-xs sm:text-sm">Global Scalability</span>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mt-4 mb-6 tracking-tight leading-[1.1]">
                        Deployed at the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Edge.</span>
                    </h2>
                    <p className="text-gray-500 text-lg sm:text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10">
                        Zero latency buffering. We run inference on bare-metal clusters directly adjacent to your customers in 14+ Tier-4 global data centers.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-8 justify-center lg:justify-start">
                        <div className="text-left font-medium border-l-2 border-blue-600 pl-4">
                            <div className="text-3xl font-black text-gray-900">&lt;200ms</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Glass-to-glass Latency</div>
                        </div>
                        <div className="text-left font-medium border-l-2 border-indigo-600 pl-4">
                            <div className="text-3xl font-black text-gray-900">99.99%</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">SLA Uptime</div>
                        </div>
                        <div className="text-left font-medium border-l-2 border-green-500 pl-4">
                            <div className="text-3xl font-black text-gray-900">14+</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Edge Nodes</div>
                        </div>
                    </div>
                </div>

                {/* Right Interactive Globe */}
                <div className="flex-1 w-full relative flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-full blur-3xl scale-75 opacity-70"></div>
                    <GlobeCdn className="z-10 scale-110 sm:scale-125 lg:scale-110 drop-shadow-2xl" />
                </div>
            </div>
        </section>
    );
}
