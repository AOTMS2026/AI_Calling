import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Braces, Calendar, RefreshCw, Database, Volume2, PhoneCall, BarChart2, ChevronDown, Plus, Loader2, PhoneOff, ArrowRightLeft, Hash, Wrench, Info, Pencil, Trash, Link as LinkIcon, Globe, Clock, X, Search, MessageSquare } from 'lucide-react';
import { CiMicrophoneOn } from 'react-icons/ci';
import { apiClient } from '../../api/client';

interface AIAgentToolsSidebarProps {
    onOpenTransferModal: () => void;
    onOpenEndCallModal: () => void;
    onOpenIVRModal: () => void;
    agentTools: any[];
    onDeleteTool: (id: string) => void;
    onToggleTool: (id: string, disabled: boolean) => void;
    onEditTool: (tool: any) => void;
    onSaveCalendar?: (apiKey: string, eventId: string, timezone: string) => void;
    isCalendarSaving?: boolean;

    // Speech Configuration Settings Props
    ambientSound: string;
    setAmbientSound: (val: string) => void;
    ambientSoundVolume: number;
    setAmbientSoundVolume: (val: number) => void;
    reminderSeconds: number;
    setReminderSeconds: (val: number) => void;
    reminderMaxCount: number;
    setReminderMaxCount: (val: number) => void;
    reminderMessage: string;
    setReminderMessage: (val: string) => void;
    interruptionSensitivity: number;
    setInterruptionSensitivity: (val: number) => void;
    onSaveSpeechSettings?: () => void;
    isSpeechSettingsSaving?: boolean;

    // Call Settings Config Props
    voicemailDetectionEnabled: boolean;
    setVoicemailDetectionEnabled: (val: boolean) => void;
    voicemailTimeout: number;
    setVoicemailTimeout: (val: number) => void;
    silenceTimeout: number;
    setSilenceTimeout: (val: number) => void;
    durationLimit: number;
    setDurationLimit: (val: number) => void;
    emergencyFallbackEnabled: boolean;
    setEmergencyFallbackEnabled: (val: boolean) => void;
    emergencyFallbackNumber: string;
    setEmergencyFallbackNumber: (val: string) => void;
    ringDuration: number;
    setRingDuration: (val: number) => void;
    onSaveCallSettings?: () => void;
    isCallSettingsSaving?: boolean;

    // Welcome Message settings props
    startSpeaker: string;
    setStartSpeaker: (val: string) => void;
    welcomeMessageType: "dynamic" | "custom";
    setWelcomeMessageType: (val: "dynamic" | "custom") => void;
    beginMessage: string;
    setBeginMessage: (val: string) => void;
}

const IANA_TIME_ZONES = [
    "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmara", "Africa/Asmera", "Africa/Bamako",
    "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre", "Africa/Brazzaville", "Africa/Bujumbura", "Africa/Cairo",
    "Africa/Casablanca", "Africa/Ceuta", "Africa/Conakry", "Africa/Dakar", "Africa/Dar_es_Salaam", "Africa/Djibouti", "Africa/Douala",
    "Africa/El_Aaiun", "Africa/Freetown", "Africa/Gaborone", "Africa/Harare", "Africa/Johannesburg", "Africa/Juba", "Africa/Kampala",
    "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos", "Africa/Libreville", "Africa/Lome", "Africa/Luanda",
    "Africa/Lubumbashi", "Africa/Lusaka", "Africa/Malabo", "Africa/Maputo", "Africa/Maseru", "Africa/Mbabane", "Africa/Mogadishu",
    "Africa/Monrovia", "Africa/Nairobi", "Africa/Ndjamena", "Africa/Niamey", "Africa/Nouakchott", "Africa/Ouagadougou", "Africa/Porto-Novo",
    "Africa/Sao_Tome", "Africa/Timbuktu", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek", "America/Adak", "America/Anchorage",
    "America/Anguilla", "America/Antigua", "America/Araguaina", "America/Argentina/Buenos_Aires", "America/Argentina/Catamarca",
    "America/Argentina/ComodRivadavia", "America/Argentina/Cordoba", "America/Argentina/Jujuy", "America/Argentina/La_Rioja",
    "America/Argentina/Mendoza", "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan",
    "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia", "America/Aruba", "America/Asuncion",
    "America/Atikokan", "America/Atka", "America/Bahia", "America/Bahia_Banderas", "America/Barbados", "America/Belem", "America/Belize",
    "America/Blanc-Sablon", "America/Boa_Vista", "America/Bogota", "America/Boise", "America/Buenos_Aires", "America/Cambridge_Bay",
    "America/Campo_Grande", "America/Cancun", "America/Caracas", "America/Catamarca", "America/Cayenne", "America/Cayman",
    "America/Chicago", "America/Chihuahua", "America/Ciudad_Juarez", "America/Coral_Harbour", "America/Cordoba", "America/Costa_Rica",
    "America/Creston", "America/Cuiaba", "America/Curacao", "America/Danmarkshavn", "America/Dawson", "America/Dawson_Creek",
    "America/Denver", "America/Detroit", "America/Dominica", "America/Edmonton", "America/Eirunepe", "America/El_Salvador",
    "America/Ensenada", "America/Fort_Nelson", "America/Fort_Wayne", "America/Fortaleza", "America/Glace_Bay", "America/Godthab",
    "America/Goose_Bay", "America/Grand_Turk", "America/Grenada", "America/Guadeloupe", "America/Guatemala", "America/Guayaquil",
    "America/Guyana", "America/Halifax", "America/Havana", "America/Hermosillo", "America/Indiana/Indianapolis", "America/Indiana/Knox",
    "America/Indiana/Marengo", "America/Indiana/Petersburg", "America/Indiana/Tell_City", "America/Indiana/Vevay", "America/Indiana/Vincennes",
    "America/Indiana/Winamac", "America/Indianapolis", "America/Inuvik", "America/Iqaluit", "America/Jamaica", "America/Jujuy", "America/Juneau",
    "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/Knox_IN", "America/Kralendijk", "America/La_Paz", "America/Lima",
    "America/Los_Angeles", "America/Louisville", "America/Lower_Princes", "America/Maceio", "America/Managua", "America/Manaus", "America/Marigot",
    "America/Martinique", "America/Matamoros", "America/Mazatlan", "America/Mendoza", "America/Menominee", "America/Merida", "America/Metlakatla",
    "America/Mexico_City", "America/Miquelon", "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Montreal",
    "America/Montserrat", "America/Nassau", "America/New_York", "America/Nipigon", "America/Nome", "America/Noronha", "America/North_Dakota/Beulah",
    "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/Nuuk", "America/Ojinaga", "America/Panama", "America/Pangnirtung",
    "America/Paramaribo", "America/Phoenix", "America/Port-au-Prince", "America/Port_of_Spain", "America/Porto_Acre", "America/Porto_Velho",
    "America/Puerto_Rico", "America/Punta_Arenas", "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina",
    "America/Resolute", "America/Rio_Branco", "America/Rosario", "America/Santa_Isabel", "America/Santarem", "America/Santiago",
    "America/Santo_Domingo", "America/Sao_Paulo", "America/Scoresbysund", "America/Shiprock", "America/Sitka", "America/St_Barthelemy",
    "America/St_Johns", "America/St_Kitts", "America/St_Lucia", "America/St_Thomas", "America/St_Vincent", "America/Swift_Current",
    "America/Tegucigalpa", "America/Thule", "America/Thunder_Bay", "America/Tijuana", "America/Toronto", "America/Tortola", "America/Vancouver",
    "America/Virgin", "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife", "Antarctica/Casey",
    "Antarctica/Davis", "Antarctica/DumontDUrville", "Antarctica/Macquarie", "Antarctica/Mawson", "Antarctica/McMurdo", "Antarctica/Palmer",
    "Antarctica/Rothera", "Antarctica/Syowa", "Antarctica/Troll", "Antarctica/Vostok", "Arctic/Longyearbyen", "Asia/Aden", "Asia/Almaty",
    "Asia/Amman", "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Ashkhabad", "Asia/Atyrau", "Asia/Baghdad", "Asia/Bahrain",
    "Asia/Baku", "Asia/Bangkok", "Asia/Barnaul", "Asia/Beirut", "Asia/Bishkek", "Asia/Brunei", "Asia/Calcutta", "Asia/Chita", "Asia/Choibalsan",
    "Asia/Chongqing", "Asia/Chungking", "Asia/Colombo", "Asia/Dacca", "Asia/Damascus", "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe",
    "Asia/Famagusta", "Asia/Gaza", "Asia/Harbin", "Asia/Hebron", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk", "Asia/Istanbul",
    "Asia/Jakarta", "Asia/Jayapura", "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka", "Asia/Karachi", "Asia/Kashgar", "Asia/Kathmandu",
    "Asia/Katmandu", "Asia/Khandyga", "Asia/Kolkata", "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Kuwait", "Asia/Macao",
    "Asia/Macau", "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Muscat", "Asia/Nicosia", "Asia/Novokuznetsk", "Asia/Novosibirsk",
    "Asia/Omsk", "Asia/Oral", "Asia/Phnom_Penh", "Asia/Pontianak", "Asia/Pyongyang", "Asia/Qatar", "Asia/Qostanay", "Asia/Qyzylorda", "Asia/Rangoon",
    "Asia/Riyadh", "Asia/Saigon", "Asia/Sakhalin", "Asia/Samarkand", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Srednekolymsk",
    "Asia/Taipei", "Asia/Tashkent", "Asia/Tbilisi", "Asia/Tehran", "Asia/Tel_Aviv", "Asia/Thimbu", "Asia/Thimphu", "Asia/Tokyo", "Asia/Tomsk",
    "Asia/Ujung_Pandang", "Asia/Ulaanbaatar", "Asia/Ulan_Bator", "Asia/Urumqi", "Asia/Ust-Nera", "Asia/Vientiane", "Asia/Vladivostok",
    "Asia/Yakutsk", "Asia/Yangon", "Asia/Yekaterinburg", "Asia/Yerevan", "Atlantic/Azores", "Atlantic/Bermuda", "Atlantic/Canary",
    "Atlantic/Cape_Verde", "Atlantic/Faeroe", "Atlantic/Faroe", "Atlantic/Jan_Mayen", "Atlantic/Madeira", "Atlantic/Reykjavik",
    "Atlantic/South_Georgia", "Atlantic/St_Helena", "Atlantic/Stanley", "Australia/ACT", "Australia/Adelaide", "Australia/Brisbane",
    "Australia/Broken_Hill", "Australia/Canberra", "Australia/Currie", "Australia/Darwin", "Australia/Eucla", "Australia/Hobart", "Australia/LHI",
    "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/NSW", "Australia/North", "Australia/Perth",
    "Australia/Queensland", "Australia/South", "Australia/Sydney", "Australia/Tasmania", "Australia/Victoria", "Australia/West",
    "Australia/Yancowinna", "Brazil/Acre", "Brazil/DeNoronha", "Brazil/East", "Brazil/West", "CET", "CST6CDT", "Canada/Atlantic",
    "Canada/Central", "Canada/Eastern", "Canada/Mountain", "Canada/Newfoundland", "Canada/Pacific", "Canada/Saskatchewan", "Canada/Yukon",
    "Chile/Continental", "Chile/EasterIsland", "Cuba", "EET", "EST", "EST5EDT", "Egypt", "Eire", "Etc/GMT", "Etc/GMT+0", "Etc/GMT+1", "Etc/GMT+10",
    "Etc/GMT+11", "Etc/GMT+12", "Etc/GMT+2", "Etc/GMT+3", "Etc/GMT+4", "Etc/GMT+5", "Etc/GMT+6", "Etc/GMT+7", "Etc/GMT+8", "Etc/GMT+9", "Etc/GMT-0",
    "Etc/GMT-1", "Etc/GMT-10", "Etc/GMT-11", "Etc/GMT-12", "Etc/GMT-13", "Etc/GMT-14", "Etc/GMT-2", "Etc/GMT-3", "Etc/GMT-4", "Etc/GMT-5",
    "Etc/GMT-6", "Etc/GMT-7", "Etc/GMT-8", "Etc/GMT-9", "Etc/GMT0", "Etc/Greenwich", "Etc/UCT", "Etc/UTC", "Etc/Universal", "Etc/Zulu",
    "Europe/Amsterdam", "Europe/Andorra", "Europe/Astrakhan", "Europe/Athens", "Europe/Belfast", "Europe/Belgrade", "Europe/Berlin",
    "Europe/Bratislava", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest", "Europe/Busingen", "Europe/Chisinau", "Europe/Copenhagen",
    "Europe/Dublin", "Europe/Gibraltar", "Europe/Guernsey", "Europe/Helsinki", "Europe/Isle_of_Man", "Europe/Istanbul", "Europe/Jersey",
    "Europe/Kaliningrad", "Europe/Kiev", "Europe/Kirov", "Europe/Kyiv", "Europe/Lisbon", "Europe/Ljubljana", "Europe/London", "Europe/Luxembourg",
    "Europe/Madrid", "Europe/Malta", "Europe/Mariehamn", "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Nicosia", "Europe/Oslo",
    "Europe/Paris", "Europe/Podgorica", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara", "Europe/San_Marino", "Europe/Sarajevo",
    "Europe/Saratov", "Europe/Simferopol", "Europe/Skopje", "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Tirane", "Europe/Tiraspol",
    "Europe/Ulyanovsk", "Europe/Uzhgorod", "Europe/Vaduz", "Europe/Vatican", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd", "Europe/Warsaw",
    "Europe/Zagreb", "Europe/Zaporozhye", "Europe/Zurich", "Factory", "GB", "GB-Eire", "GMT", "GMT+0", "GMT-0", "GMT0", "Greenwich", "HST",
    "Hongkong", "Iceland", "Indian/Antananarivo", "Indian/Chagos", "Indian/Christmas", "Indian/Cocos", "Indian/Comoro", "Indian/Kerguelen",
    "Indian/Mahe", "Indian/Maldives", "Indian/Mauritius", "Indian/Mayotte", "Indian/Reunion", "Iran", "Israel", "Jamaica", "Japan", "Kwajalein",
    "Libya", "MET", "MST", "MST7MDT", "Mexico/BajaNorte", "Mexico/BajaSur", "Mexico/General", "NZ", "NZ-CHAT", "Navajo", "Pacific/Apia",
    "Pacific/Auckland", "Pacific/Bougainville", "Pacific/Chatham", "Pacific/Chuuk", "Pacific/Easter", "Pacific/Efate", "Pacific/Enderbury",
    "Pacific/Fakaofo", "Pacific/Fiji", "Pacific/Funafuti", "Pacific/Galapagos", "Pacific/Gambier", "Pacific/Guadalcanal", "Pacific/Guam",
    "Pacific/Honolulu", "Pacific/Johnston", "Pacific/Kanton", "Pacific/Kiritimati", "Pacific/Kosrae", "Pacific/Kwajalein", "Pacific/Majuro",
    "Pacific/Marquesas", "Pacific/Midway", "Pacific/Nauru", "Pacific/Niue", "Pacific/Norfolk", "Pacific/Noumea", "Pacific/Pago_Pago", "Pacific/Palau",
    "Pacific/Pitcairn", "Pacific/Pohnpei", "Pacific/Ponape", "Pacific/Port_Moresby", "Pacific/Rarotonga", "Pacific/Saipan", "Pacific/Samoa",
    "Pacific/Tahiti", "Pacific/Tarawa", "Pacific/Tongatapu", "Pacific/Truk", "Pacific/Wake", "Pacific/Wallis", "Pacific/Yap", "Poland", "Portugal",
    "ROC", "ROK", "Singapore", "Turkey", "UCT", "US/Alaska", "US/Aleutian", "US/Arizona", "US/Central", "US/East-Indiana", "US/Eastern", "US/Hawaii",
    "US/Indiana-Starke", "US/Michigan", "US/Mountain", "US/Pacific", "US/Samoa", "UTC", "Universal", "W-SU", "WET", "Zulu"
];

const mapAmbientSoundValue = (val: string) => {
    if (!val) return "none";
    const lower = val.toLowerCase();
    if (lower === "none" || lower === "null") return "none";
    if (lower === "city") return "City";
    if (lower === "forest") return "Forest";
    if (lower === "crowded") return "Crowded";
    if (lower === "keyboard") return "Keyboard";
    if (lower === "hold") return "Hold";
    return val;
};

export function AIAgentToolsSidebar({
    onOpenTransferModal,
    onOpenEndCallModal,
    onOpenIVRModal,
    agentTools,
    onDeleteTool,
    onToggleTool,
    onEditTool,
    onSaveCalendar,
    isCalendarSaving,
    ambientSound,
    setAmbientSound,
    ambientSoundVolume,
    setAmbientSoundVolume,
    reminderSeconds,
    setReminderSeconds,
    reminderMaxCount,
    setReminderMaxCount,
    reminderMessage,
    setReminderMessage,
    interruptionSensitivity,
    setInterruptionSensitivity,
    onSaveSpeechSettings,
    isSpeechSettingsSaving,
    voicemailDetectionEnabled,
    setVoicemailDetectionEnabled,
    voicemailTimeout,
    setVoicemailTimeout,
    silenceTimeout,
    setSilenceTimeout,
    durationLimit,
    setDurationLimit,
    emergencyFallbackEnabled,
    setEmergencyFallbackEnabled,
    emergencyFallbackNumber,
    setEmergencyFallbackNumber,
    ringDuration,
    setRingDuration,
    onSaveCallSettings,
    isCallSettingsSaving,
    startSpeaker,
    setStartSpeaker,
    welcomeMessageType,
    setWelcomeMessageType,
    beginMessage,
    setBeginMessage
}: AIAgentToolsSidebarProps) {
    const navigate = useNavigate();
    const [isFunctionsExpanded, setIsFunctionsExpanded] = useState(false);
    const [showFunctionDropdown, setShowFunctionDropdown] = useState(false);
    const [isCalendarsExpanded, setIsCalendarsExpanded] = useState(false);
    const [isSpeechExpanded, setIsSpeechExpanded] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
    const [isWelcomeMessageExpanded, setIsWelcomeMessageExpanded] = useState(false);

    // Calendar Integration States
    const [calendarTimezone, setCalendarTimezone] = useState('UTC');
    const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false);
    const [timezoneSearch, setTimezoneSearch] = useState('');
    const [calProviderSelected, setCalProviderSelected] = useState(false);
    const [calcomApiKey, setCalcomApiKey] = useState('');
    const [calcomEventId, setCalcomEventId] = useState('');

    // Call Settings State
    const [isCallSettingsExpanded, setIsCallSettingsExpanded] = useState(false);
    const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
    const [fetchingNumbers, setFetchingNumbers] = useState(false);

    const fetchNumbers = async (country: string) => {
        setFetchingNumbers(true);
        try {
            const response = await apiClient.get(`/phone-numbers/available-numbers/${country}`);
            setAvailableNumbers(response.data.data || []);
        } catch (e) {
            console.error(e);
        }
        setFetchingNumbers(false);
    };

    return (
        <div className="w-full lg:w-[320px] 2xl:w-[380px] flex flex-col gap-3 shrink-0 transition-all overflow-y-auto">
            <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-2 flex flex-col h-full">

                {/* Functions Item */}
                <div
                    onClick={() => setIsFunctionsExpanded(!isFunctionsExpanded)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <Braces size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Functions</span>
                        {agentTools && agentTools.length > 0 && (
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{agentTools.length}</span>
                        )}
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isFunctionsExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isFunctionsExpanded && (
                    <div className="px-3 pb-3 flex flex-col gap-2 relative">
                        <button
                            onClick={() => setShowFunctionDropdown(!showFunctionDropdown)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-dashed border-gray-300 text-sm font-bold text-gray-600 transition-colors relative z-10"
                        >
                            <Plus size={16} /> Add Function
                        </button>

                        {showFunctionDropdown && (
                            <div className="absolute top-12 left-3 right-3 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden transform transition-all">
                                <button onClick={onOpenEndCallModal} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"><PhoneOff size={16} className="text-black" /> End Call</button>
                                <button onClick={onOpenTransferModal} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"><ArrowRightLeft size={16} className="text-black" /> Transfer Call</button>
                                <button onClick={onOpenIVRModal} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"><Hash size={16} className="text-black" /> IVR/Press Digit</button>
                            </div>
                        )}

                        {agentTools && agentTools.length > 0 && (
                            <div className="flex flex-col gap-2.5 mt-3">
                                {agentTools.map(tool => (
                                    <div key={tool.id} className="flex flex-col gap-2 p-3 bg-[#f2fbfc] rounded-xl border border-[#4db5c2]/60 shadow-sm transition-all hover:shadow cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Wrench size={14} className="text-gray-500" />
                                                <span className="text-[13px] font-bold text-gray-800">{tool.name}</span>
                                                <Info size={13} className="text-gray-400" />
                                            </div>
                                            <div className="flex items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onEditTool(tool)} className="text-gray-500 hover:text-blue-500 transition-colors">
                                                    <Pencil size={13} />
                                                </button>
                                                <button onClick={() => onDeleteTool(tool.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                                    <Trash size={13} />
                                                </button>
                                                <div
                                                    onClick={() => onToggleTool(tool.id, tool.disabled)}
                                                    className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${!tool.disabled ? 'bg-[#0a8ea0]' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${!tool.disabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                </div>
                                            </div>
                                        </div>
                                        {tool.description && (
                                            <span className="text-[11px] font-semibold text-gray-500 line-clamp-2 leading-relaxed ml-[22px]">{tool.description}</span>
                                        )}
                                        <div className="flex items-center gap-2 mt-1 ml-[22px]">
                                            <span className="text-[10px] font-black text-gray-700 bg-white border border-gray-100 px-2.5 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] uppercase">{tool.type?.replace('_', ' ')}</span>
                                            <span className="text-[10px] font-bold text-[#0a8ea0] bg-[#cbf2f7]/80 px-2.5 py-0.5 rounded capitalize">Agent</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Calendars */}
                <div
                    onClick={() => setIsCalendarsExpanded(!isCalendarsExpanded)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Calendars</span>
                        {calProviderSelected && <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">Cal.com · Setup</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Info size={14} className="text-gray-400 group-hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100" />
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCalendarsExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {isCalendarsExpanded && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe size={14} className="text-gray-400" />
                            <span className="text-[12px] font-bold text-gray-700">Calendar Time Zone</span>
                            <Info size={12} className="text-gray-400" />
                        </div>

                        {/* Dropdown for TZ */}
                        <div className="relative mb-6">
                            <button onClick={() => setIsTimezoneDropdownOpen(!isTimezoneDropdownOpen)} className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm text-[13px] font-semibold text-gray-800 focus:outline-none focus:border-blue-500">
                                {calendarTimezone}
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isTimezoneDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isTimezoneDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                                    <div className="p-2 border-b border-gray-100 flex items-center gap-2">
                                        <Search size={14} className="text-gray-400" />
                                        <input type="text" placeholder="Search time zones..." className="w-full text-[13px] font-medium outline-none text-gray-700" value={timezoneSearch} onChange={e => setTimezoneSearch(e.target.value)} />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                        {IANA_TIME_ZONES.filter(t => t.toLowerCase().includes(timezoneSearch.toLowerCase())).map(tz => (
                                            <button key={tz} onClick={() => { setCalendarTimezone(tz); setIsTimezoneDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 rounded">
                                                {tz}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Select Provider Header */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-gray-500 font-medium">Select a different provider</span>
                            <button className="text-[11px] text-gray-500 font-bold hover:text-gray-700 transition-colors">Cancel</button>
                        </div>

                        {/* Cal.com Box */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-gray-300">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {!calProviderSelected ? (
                                        <input
                                            type="radio"
                                            checked={calProviderSelected}
                                            onChange={() => setCalProviderSelected(true)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 cursor-pointer"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                            <Clock size={12} className="text-gray-500" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-[13px] font-bold text-gray-800">Cal.com</div>
                                        <div className="text-[11px] text-gray-500 font-medium">Cal.com appointment scheduling</div>
                                    </div>
                                </div>
                                {calProviderSelected && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCalProviderSelected(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {calProviderSelected && (
                                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Cal.com API Key</label>
                                        <input type="text" value={calcomApiKey} onChange={e => setCalcomApiKey(e.target.value)} placeholder="cal_live_..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] font-medium text-gray-800 outline-none focus:border-blue-500 transition-all shadow-sm" />
                                        <p className="text-[10px] text-gray-400 mt-1 font-medium">Your agent's own Cal.com API key.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Event ID</label>
                                        <input type="text" value={calcomEventId} onChange={e => setCalcomEventId(e.target.value)} placeholder="5251574" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] font-medium text-gray-800 outline-none focus:border-blue-500 transition-all shadow-sm" />
                                        <p className="text-[10px] text-gray-400 mt-1 font-medium">The event ID from your Cal.com dashboard</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="mt-5 flex items-center justify-end">
                            <button
                                onClick={() => onSaveCalendar && onSaveCalendar(calcomApiKey, calcomEventId, calendarTimezone)}
                                disabled={isCalendarSaving || !calProviderSelected}
                                className={`px-5 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-2 shadow-sm transition-colors ${!calProviderSelected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#0a8ea0] hover:bg-[#077a8a] text-white'}`}
                            >
                                {isCalendarSaving && <Loader2 size={16} className="animate-spin" />}
                                Save configuration
                            </button>
                        </div>
                    </div>
                )}
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Welcome Message Form Block */}
                <div
                    onClick={() => setIsWelcomeMessageExpanded(!isWelcomeMessageExpanded)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <MessageSquare size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800 flex items-center gap-1.5">
                            Welcome Message
                            <span title="Define how the phone call initiates and who speaks first"><Info size={13} className="text-gray-400 cursor-pointer hover:text-gray-600" /></span>
                        </span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isWelcomeMessageExpanded ? 'rotate-180' : ''}`} />
                </div>
                {isWelcomeMessageExpanded && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200 flex flex-col gap-4">
                        {/* Selector 1 */}
                        <div>
                            <select
                                value={startSpeaker}
                                onChange={(e) => setStartSpeaker(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-bold text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm"
                            >
                                <option value="agent">AI speaks first</option>
                                <option value="user">User speaks first</option>
                            </select>
                        </div>
                        {/* Selector 2 */}
                        <div>
                            <select
                                value={welcomeMessageType}
                                onChange={(e) => setWelcomeMessageType(e.target.value as "dynamic" | "custom")}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-bold text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm"
                            >
                                <option value="dynamic">Dynamic message based on prompt</option>
                                <option value="custom">Custom message</option>
                            </select>
                        </div>
                        {/* Conditional Custom Message input */}
                        {welcomeMessageType === 'custom' && (
                            <div className="animate-in slide-in-from-top-1 duration-150">
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">User Enter Message</label>
                                <input
                                    type="text"
                                    placeholder="Enter greeting message here..."
                                    value={beginMessage}
                                    onChange={(e) => setBeginMessage(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-800 outline-none focus:border-[#0a8ea0] shadow-sm"
                                />
                            </div>
                        )}
                    </div>
                )}
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Speech Settings */}
                <div
                    onClick={() => setIsSpeechExpanded(!isSpeechExpanded)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <Volume2 size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Speech Settings</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isSpeechExpanded ? 'rotate-180' : ''}`} />
                </div>
                {isSpeechExpanded && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200 flex flex-col gap-4">
                        {/* Background Sound Dropdown & Volume slider toggle */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-505 uppercase tracking-widest mb-1.5">Background Sound</label>
                            <div className="flex gap-2 items-center">
                                <select
                                    value={mapAmbientSoundValue(ambientSound)}
                                    onChange={(e) => setAmbientSound(e.target.value)}
                                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-bold text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                >
                                    <option value="none">None</option>
                                    <option value="City">City</option>
                                    <option value="Forest">Forest</option>
                                    <option value="Crowded">Crowded</option>
                                    <option value="Keyboard">Keyboard</option>
                                    <option value="Hold">Hold</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                                    className={`p-2.5 border rounded-[10px] transition-colors flex items-center justify-center shrink-0 ${showVolumeSlider ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-450 hover:bg-gray-50'}`}
                                >
                                    <CiMicrophoneOn size={18} />
                                </button>
                            </div>
                        </div>

                        {showVolumeSlider && (
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 flex flex-col gap-1.5 animate-in slide-in-from-top-1 duration-150 shadow-inner">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-450 uppercase">Background Vol</span>
                                    <span className="text-[12px] font-mono font-bold text-[#0a8ea0]">{(ambientSoundVolume).toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.00"
                                    max="1.00"
                                    step="0.01"
                                    value={ambientSoundVolume}
                                    onChange={(e) => setAmbientSoundVolume(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0a8ea0]"
                                />
                            </div>
                        )}

                        {/* Reminder Setting inputs */}
                        <div className="pt-2 border-t border-gray-100/80">
                            <label className="block text-[11px] font-bold text-gray-550 uppercase tracking-widest mb-0.5">Reminder Message Frequency</label>
                            <p className="text-[10px] text-gray-400 font-medium mb-3">Control how often AI sends a reminder message.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Seconds</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={reminderSeconds}
                                        onChange={(e) => setReminderSeconds(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-800 outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Times</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={reminderMaxCount}
                                        onChange={(e) => setReminderMaxCount(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-800 outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Reminder Message textarea */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Reminder Message</label>
                            <textarea
                                value={reminderMessage}
                                onChange={(e) => setReminderMessage(e.target.value)}
                                placeholder="write down Any Message"
                                rows={2}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-800 outline-none focus:border-blue-500 shadow-sm resize-none"
                            />
                        </div>

                        {/* Interruption Sensitivity */}
                        <div className="pt-2 border-t border-gray-100/80">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-[11px] font-bold text-gray-550 uppercase tracking-widest">Interruption Sensitivity</label>
                                <span className="text-[12px] font-mono font-bold text-[#0a8ea0]">{interruptionSensitivity.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0.00"
                                max="1.00"
                                step="0.01"
                                value={interruptionSensitivity}
                                onChange={(e) => setInterruptionSensitivity(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0a8ea0]"
                            />
                        </div>

                        {/* Speech Save Button */}
                        <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={onSaveSpeechSettings}
                                disabled={isSpeechSettingsSaving}
                                className="w-full px-5 py-2.5 bg-[#0a8ea0] hover:bg-[#077a8a] text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                            >
                                {isSpeechSettingsSaving && <Loader2 size={16} className="animate-spin" />}
                                Save speech settings
                            </button>
                        </div>
                    </div>
                )}
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Call Settings */}
                <div
                    onClick={() => setIsCallSettingsExpanded(!isCallSettingsExpanded)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <PhoneCall size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Call Settings</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCallSettingsExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isCallSettingsExpanded && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200 flex flex-col gap-5">
                        {/* Voicemail detection */}
                        <div className="flex flex-col gap-3 p-3.5 bg-white border border-gray-150 rounded-xl shadow-xs">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] font-bold text-gray-800">Voicemail detection</span>
                                        <span title="Automatically identify voicemail signals"><Info size={13} className="text-gray-400 cursor-pointer hover:text-gray-600" /></span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">Detect and handle voicemail automatically.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setVoicemailDetectionEnabled(!voicemailDetectionEnabled)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${voicemailDetectionEnabled ? 'bg-[#0a8ea0]' : 'bg-gray-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${voicemailDetectionEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {voicemailDetectionEnabled && (
                                <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5 animate-in slide-in-from-top-1 duration-150">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[11px] font-bold text-gray-600">Voicemail timeout</span>
                                            <Info size={11} className="text-gray-400" />
                                        </div>
                                        <span className="text-[12px] font-mono font-bold text-[#0a8ea0]">{voicemailTimeout} s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="120"
                                        value={voicemailTimeout}
                                        onChange={(e) => setVoicemailTimeout(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-gray-105 rounded-lg appearance-none cursor-pointer accent-[#0a8ea0]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* End call on silence */}
                        <div className="flex flex-col gap-3 p-3.5 bg-white border border-gray-150 rounded-xl shadow-xs">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] font-bold text-gray-800">End call on silence</span>
                                        <span title="Terminate call when silence threshold is reached"><Info size={13} className="text-gray-400 cursor-pointer hover:text-gray-600" /></span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">End call when prolonged silence is detected.</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] font-bold text-gray-600">Silence timeout</span>
                                        <Info size={11} className="text-gray-400" />
                                    </div>
                                    <span className="text-[12px] font-mono font-bold text-[#0a8ea0]">{silenceTimeout} s</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="60"
                                    value={silenceTimeout}
                                    onChange={(e) => setSilenceTimeout(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-gray-105 rounded-lg appearance-none cursor-pointer accent-[#0a8ea0]"
                                />
                            </div>
                        </div>

                        {/* Max duration */}
                        <div className="flex flex-col gap-3 p-3.5 bg-white border border-gray-150 rounded-xl shadow-xs">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] font-bold text-gray-800">Max duration</span>
                                        <span title="Enforce maximum cap on call length"><Info size={13} className="text-gray-400 cursor-pointer hover:text-gray-600" /></span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">Set a maximum call duration.</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] font-bold text-gray-600">Duration limit</span>
                                        <Info size={11} className="text-gray-400" />
                                    </div>
                                    <span className="text-[12px] font-mono font-bold text-[#0a8ea0]">{durationLimit} min</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="60"
                                    value={durationLimit}
                                    onChange={(e) => setDurationLimit(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-gray-105 rounded-lg appearance-none cursor-pointer accent-[#0a8ea0]"
                                />
                            </div>
                        </div>

                        {/* Emergency fallback */}
                        <div className="flex flex-col gap-3 p-3.5 bg-white border border-gray-150 rounded-xl shadow-xs">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] font-bold text-gray-800">Emergency fallback</span>
                                        <span title="Forward call when agent runs into an active fault"><Info size={13} className="text-gray-400 cursor-pointer hover:text-gray-600" /></span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">Transfer the call to a backup number on failure.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEmergencyFallbackEnabled(!emergencyFallbackEnabled)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emergencyFallbackEnabled ? 'bg-[#0a8ea0]' : 'bg-gray-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${emergencyFallbackEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {emergencyFallbackEnabled && (
                                <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5 animate-in slide-in-from-top-1 duration-150">
                                    <label className="block text-[10px] font-bold text-[#0a8ea0] uppercase">Backup Number</label>
                                    <input
                                        type="text"
                                        placeholder="+1234567890"
                                        value={emergencyFallbackNumber}
                                        onChange={(e) => setEmergencyFallbackNumber(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-800 outline-none focus:border-[#0a8ea0] shadow-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Advanced (Ring duration) */}
                        <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xs">
                            <div
                                onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                                className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[12px] font-bold text-gray-700">Advanced</span>
                                    <Info size={12} className="text-gray-400" />
                                </div>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isAdvancedExpanded ? 'rotate-180' : ''}`} />
                            </div>
                            {isAdvancedExpanded && (
                                <div className="p-3.5 bg-white border-t border-gray-100 flex flex-col gap-2 animate-in slide-in-from-top-1 duration-150">
                                    <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
                                        <span>Ring duration</span>
                                        <span className="text-[12px] font-mono text-[#0a8ea0]">{ringDuration} s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="120"
                                        value={ringDuration}
                                        onChange={(e) => setRingDuration(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-gray-105 rounded-lg appearance-none cursor-pointer accent-[#0a8ea0]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={onSaveCallSettings}
                                disabled={isCallSettingsSaving}
                                className="w-full px-5 py-2.5 bg-[#0a8ea0] hover:bg-[#077a8a] text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                            >
                                {isCallSettingsSaving && <Loader2 size={16} className="animate-spin" />}
                                Save call settings
                            </button>
                        </div>

                        {/* Available Phone Numbers section */}
                        <div className="pt-4 border-t border-gray-150 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-500 uppercase">Available Phone Numbers</span>
                                <button
                                    type="button"
                                    onClick={() => fetchNumbers('US')}
                                    className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
                                >
                                    {fetchingNumbers ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Fetch US
                                </button>
                            </div>
                            <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto">
                                {availableNumbers.length === 0 && !fetchingNumbers && (
                                    <div className="text-center p-3 text-[11px] text-gray-400 border border-dashed rounded-lg">No numbers fetched yet.</div>
                                )}
                                {availableNumbers.map((num, i) => (
                                    <div key={i} className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-150 hover:border-blue-200 transition-colors cursor-pointer shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12px] font-bold text-gray-800 tracking-tight">{num.phoneNumber || num.phone_number}</span>
                                            <span className="text-[9px] font-bold text-slate-600 bg-slate-200/50 px-1.5 py-0.5 rounded">{num.isoCountry || num.iso_country}</span>
                                        </div>
                                        <span className="text-[9px] text-gray-500 font-medium">Inbound: ${num.perMinutePriceInbound ?? num.per_minute_price_inbound}/min • Outbound: ${num.perMinutePriceOutbound ?? num.per_minute_price_outbound}/min</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}
