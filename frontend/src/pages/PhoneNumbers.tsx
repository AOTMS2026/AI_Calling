import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Phone, Loader2, RefreshCw, ShoppingCart } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function PhoneNumbers() {
    const [numbers, setNumbers] = useState<any[]>([]);
    const [myNumbers, setMyNumbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMy, setLoadingMy] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const fetchNumbers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/ravan/phone-numbers/available-numbers/IN?region=IN');
            setNumbers(response.data.data || []);
        } catch (error) {
            toast.error("Failed to fetch Indian phone numbers.");
        } finally {
            setLoading(false);
        }
    };

    const fetchMyNumbers = async () => {
        setLoadingMy(true);
        try {
            const response = await apiClient.get('/api/ravan/phone-numbers/my');
            setMyNumbers(response.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMy(false);
        }
    };

    const handleBuyNumber = async (num: any) => {
        const phone = num.phoneNumber || num.phone_number;
        setPurchasing(phone);
        try {
            const payload = {
                phone_number: phone,
                price: num.price || 0,
                per_minute_price_inbound: num.perMinutePriceInbound ?? num.per_minute_price_inbound ?? 0,
                per_minute_price_outbound: num.perMinutePriceOutbound ?? num.per_minute_price_outbound ?? 0
            };
            await apiClient.post('/api/ravan/phone-numbers/buy', payload);
            toast.success(`Successfully acquired ${phone}!`);
            // Refresh list after purchasing to pull it off the available list securely
            fetchNumbers();
            fetchMyNumbers();
        } catch (error) {
            console.error(error);
            toast.error(`Failed to buy number ${phone}.`);
        } finally {
            setPurchasing(null);
        }
    };

    useEffect(() => {
        fetchNumbers();
        fetchMyNumbers();
    }, []);

    return (
        <MainLayout>
            <div className="p-6 max-w-6xl mx-auto w-full flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Available Numbers</h1>
                        <p className="text-[13px] font-medium text-gray-500 mt-1">Acquire verified Indian direct inward dialing (DID) numbers for agents.</p>
                    </div>
                    <button
                        onClick={fetchNumbers}
                        disabled={loading}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md transition-all flex items-center gap-2 group disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <RefreshCw size={16} className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />}
                        Refresh List
                    </button>
                </div>

                {/* My Numbers Section */}
                <div className="w-full mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                        <Phone size={20} className="text-blue-500" /> My Active Numbers
                    </h2>
                    <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        {loadingMy ? (
                            <div className="flex justify-center p-12 text-gray-400">
                                <Loader2 size={24} className="animate-spin text-blue-500" />
                            </div>
                        ) : myNumbers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                <p className="text-sm font-semibold">You have not purchased any phonenumber.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                                {myNumbers.map((num, i) => (
                                    <div key={i} className="flex flex-col p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Phone size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-[17px] font-black text-gray-900">{num.phone_number}</h3>
                                                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${num.status === 'Activate' ? 'bg-emerald-50 text-emerald-600' :
                                                        num.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-red-50 text-red-600'
                                                    }`}>
                                                    {num.status === 'Activate' ? 'Active' : num.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-blue-50/50 flex justify-between text-[11px] font-bold text-gray-500">
                                            <span>Price: <span className="text-gray-900">${num.price}</span></span>
                                            <span>Purchased: {new Date(num.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-24 text-gray-400">
                            <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
                            <p className="text-sm font-semibold">Scanning Ravan.ai network for +91 numbers...</p>
                        </div>
                    ) : numbers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-24 text-gray-400">
                            <Phone size={32} className="mb-4 opacity-50" />
                            <p className="text-sm font-semibold">No Indian phone numbers currently available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                            {numbers.map((num, i) => (
                                <div key={i} className="flex flex-col p-5 bg-white border border-gray-100/80 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                <Phone size={16} className="text-slate-500 group-hover:text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-[17px] font-black text-gray-900 tracking-tight">{num.phoneNumber || num.phone_number}</h3>
                                                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded-full">{num.isoCountry || num.iso_country}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[14px] font-black text-gray-900">${num.price}</span>
                                            <span className="text-[10px] font-bold text-gray-400">/month</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-50/50">
                                        <div className="flex justify-between items-center text-[12px] font-semibold">
                                            <span className="text-gray-500">Inbound Rate:</span>
                                            <span className="text-gray-900">${num.perMinutePriceInbound ?? num.per_minute_price_inbound}/min</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[12px] font-semibold">
                                            <span className="text-gray-500">Outbound Rate:</span>
                                            <span className="text-gray-900">${num.perMinutePriceOutbound ?? num.per_minute_price_outbound}/min</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleBuyNumber(num)}
                                        disabled={purchasing === (num.phoneNumber || num.phone_number)}
                                        className="w-full mt-5 py-2.5 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-xl text-[12px] font-bold text-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {purchasing === (num.phoneNumber || num.phone_number) ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                                        {purchasing === (num.phoneNumber || num.phone_number) ? "Purchasing..." : "Buy Number"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
