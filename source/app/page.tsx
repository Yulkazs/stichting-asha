"use client";

import Image from "next/image";
import { FolderKanban, Calendar, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Define the NoticeType interface
interface NoticeType {
  _id: string;
  title: string;
  message: string;
  roles: string[];
  expirationDate: string;
  author: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notice, setNotice] = useState<NoticeType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notice on component mount
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/notices/latest');
        
        if (!response.ok) {
          throw new Error('Failed to fetch latest notice');
        }
        
        const data = await response.json();
        if (data) {
          setNotice(data);
        }
      } catch (err) {
        console.error('Error fetching notice:', err);
        setError('Could not load notice');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotice();
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#F2F2F2]">

      {/* Notice Display */}
      <div className="relative z-20">
        {isLoading ? (
          <div className="p-6 max-w-xl mx-auto bg-gray-100 rounded-md shadow-md mt-10 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ) : error ? (
          <p className="text-center text-gray-500 mt-10">{error}</p>
        ) : notice ? (
          <div className="p-6 max-w-xl mx-auto bg-yellow-200 rounded-md shadow-md mt-10">
            <h2 className="text-xl font-bold text-yellow-900 mb-0 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5"/> 
              {notice.title}
            </h2>
            <p className="text-yellow-800">{notice.message}</p>
            <div className="mt-3 text-xs text-yellow-700 flex justify-between">
              <span>Door: {notice.author}</span>
              <span>Verloopt op: {new Date(notice.expirationDate).toLocaleDateString('nl-NL')}</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-10"></p>
        )}
      </div>

      {/* SVG Curve Background */}
      <div className="absolute top-0 left-0 md:left-[50px] lg:left-[150px] w-full md:w-[calc(100%+150px)] lg:w-[calc(100%+300px)] h-[400px] md:h-[600px] lg:h-[850px] z-0">
        <svg
          viewBox="0 0 3100 1700"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <clipPath id="clip-curve">
              <path d="M0,0 C0,500 1400,1900 3100,0 L3100,0 L0,0 Z" />
            </clipPath>
          </defs>

          <image
            href="/oase.png"
            x="-290"
            y="-280"
            width="3500"
            height="1800"
            clipPath="url(#clip-curve)"
            preserveAspectRatio="xMidYMid slice"
          />

          <path
            d="M0,0 C0,500 1400,1900 3100,0"
            fill="none"
            stroke="#FFD700"
            strokeWidth="12"
          />
        </svg>
      </div>

      {/* Hoofdinhoud specifiek voor mobiel verder naar beneden geplaatst */}
      <div className="relative w-full z-10 pt-[250px] md:pt-[280px] lg:pt-[400px]">
        {/* Stichting Asha Block */}
        <div className="mx-6 md:ml-[50px] lg:ml-[100px] max-w-[90%] md:max-w-lg lg:max-w-xl mb-10 md:mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E2A78] mb-2 md:mb-4">Stichting Asha</h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-700 mb-4 md:mb-8 leading-relaxed">
            Stichting Asha (Asha betekent 'hoop' in het Hindi) is een vrijwilligersorganisatie van Surinaamse Hindostanen in de gemeente Utrecht.
            Opgericht in 1976, zet de stichting zich in om via haar activiteiten een waardevolle bijdrage te leveren aan het integratie- en participatiebeleid van de gemeente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <button
              onClick={() => router.push("/projecten")}
              className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 md:py-3 px-4 md:px-5 rounded-md text-sm md:text-base transition-all"
            >
              <FolderKanban className="w-4 h-4 md:w-[18px] md:h-[18px]" />
              Projecten
            </button>
            <button
              onClick={() => router.push("/agenda")}
              className="flex items-center justify-center gap-2 border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white font-semibold py-2 md:py-3 px-4 md:px-5 rounded-md text-sm md:text-base transition-all"
            >
              <Calendar className="w-4 h-4 md:w-[18px] md:h-[18px]" />
              Agenda
            </button>
          </div>
        </div>

        {/* Information Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-6 lg:px-10 mt-16 md:mt-24 lg:mt-32 mb-10">
          {/* Visie */}
          <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-semibold text-[#1E2A78] mb-2 md:mb-4">Visie</h2>
            <p className="text-sm md:text-base text-gray-700">
              Stichting Asha vindt het belangrijk dat de Hindostaanse gemeenschap in Utrecht de eigen cultuur en identiteit beleeft. Zo kunnen de leden van de gemeenschap de kracht opdoen om zich verder te ontwikkelen. Bovendien bevordert cultuur- en identiteitsbeleving een vlotte inburgering in de Nederlandse samenleving.
            </p>
          </div>

          {/* Missie */}
          <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-semibold text-[#1E2A78] mb-2 md:mb-4">Missie</h2>
            <p className="text-sm md:text-base text-gray-700">
              Door het organiseren van projecten en activiteiten voor de Hindostaanse gemeenschap en andere groepen in de Utrechtse samenleving, wil Stichting Asha een bijdrage leveren aan de multiculturele samenleving. Samenwerkingen met de gemeente, onderwijsinstellingen, het bedrijfsleven en welzijnsorganisaties is daardoor essentieel.
            </p>
          </div>

          {/* Media */}
          <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 md:col-span-2 lg:col-span-1">
            <h2 className="text-xl md:text-2xl font-semibold text-[#1E2A78] mb-2 md:mb-4">Media</h2>
            <p className="text-sm md:text-base text-gray-700">
              Stichting Asha wordt voortdurend door de Media benaderd. Met name de projecten sollicitatie Helpdesk, ouderen en huiswerkbegeleiding haalt veelvuldig de media. Verder zijn de praktijkvoorbeelden interessant, een verzameling daarvan ziet u bij onze projecten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}