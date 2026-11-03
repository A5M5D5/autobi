import React, { useEffect, useState } from 'react';
import { Vehicle, Language } from '../types';
import { translations } from '../lib/translations';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Loader2,
  Layers,
} from 'lucide-react';

interface ShowroomStudioProps {
  vehicles: Vehicle[];
  lang: Language;
  preselectedVehicle?: Vehicle | null;
}

export const ShowroomStudio: React.FC<ShowroomStudioProps> = ({
  vehicles,
  lang,
  preselectedVehicle,
}) => {
  const t = translations[lang];

  const [selectedVehicleId, setSelectedVehicleId] = useState(
    preselectedVehicle ? preselectedVehicle.id : vehicles[0]?.id || ''
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [theme, setTheme] = useState('indoor_showroom');
  const [customPrompt, setCustomPrompt] = useState(
    'Studio automotive photography of a vehicle in an approved showroom environment, neutral architectural lighting, clean background, catalog documentation quality.'
  );
  const [renderError, setRenderError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRenderUrl, setCurrentRenderUrl] = useState<string>(
    preselectedVehicle?.image_url || '/src/assets/images/hero_car_mercedes_sclass_1791929756477.jpg'
  );

  useEffect(() => {
    if (preselectedVehicle) {
      setSelectedVehicleId(preselectedVehicle.id);
      setCurrentRenderUrl(preselectedVehicle.image_url);
      setCustomPrompt(
        `Studio automotive photography of a ${preselectedVehicle.year} ${preselectedVehicle.make} ${preselectedVehicle.model} in ${preselectedVehicle.color}. Studio lighting, reflective showroom floor, 8k catalog quality.`
      );
    } else if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [preselectedVehicle, vehicles]);

  const [gallery, setGallery] = useState<Array<{ url: string; title: string; size: string }>>([
    {
      url: '/src/assets/images/hero_car_mercedes_sclass_1791929756477.jpg',
      title: 'Mercedes-Benz S 580 - Midnight Showroom (2K)',
      size: '2K',
    },
    {
      url: '/src/assets/images/car_porsche_taycan_1791929756676.jpg',
      title: 'Porsche Taycan Turbo S - Silver Studio (4K)',
      size: '4K',
    },
    {
      url: '/src/assets/images/car_range_rover_1791929757835.jpg',
      title: 'Range Rover Autobiography - Black Monolith (2K)',
      size: '2K',
    },
    {
      url: '/src/assets/images/car_lexus_es_1791929756502.jpg',
      title: 'Lexus ES 350 - Executive Pearl White (1K)',
      size: '1K',
    },
  ]);

  const themes = [
    {
      id: 'indoor_showroom',
      label: lang === 'ar' ? 'صالة العرض الداخلية' : 'Indoor Showroom',
      prompt: 'Studio automotive photography inside an approved vehicle showroom with polished neutral flooring, even architectural lighting and a clean background.',
    },
    {
      id: 'dark_minimalist',
      label: lang === 'ar' ? 'استوديو محايد' : 'Neutral Studio',
      prompt: 'Automotive documentation photography in a neutral studio with controlled softbox lighting, minimal reflections and a plain background.',
    },
    {
      id: 'golden_sunset',
      label: lang === 'ar' ? 'بيئة خارجية' : 'Outdoor Environment',
      prompt: 'Commercial automotive photograph in a controlled outdoor environment with natural daylight, clear background and accurate vehicle color reproduction.',
    },
    {
      id: 'architectural_glass',
      label: lang === 'ar' ? 'جناح معماري' : 'Architectural Pavilion',
      prompt: 'Automotive photography beside a contemporary architectural pavilion with balanced daylight and a clean composition.',
    },
  ];

  const handleSelectTheme = (item: typeof themes[0]) => {
    setTheme(item.id);
    const targetVeh = vehicles.find((v) => v.id === selectedVehicleId);
    const carName = targetVeh ? `${targetVeh.year} ${targetVeh.make} ${targetVeh.model}` : 'vehicle';
    setCustomPrompt(`Studio automotive photography of a ${carName}. ${item.prompt}`);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setRenderError('');
    const targetVeh = vehicles.find((v) => v.id === selectedVehicleId);
    const carName = targetVeh ? `${targetVeh.year} ${targetVeh.make} ${targetVeh.model}` : 'vehicle';

    try {
      const res = await fetch('/api/gemini/studio-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${customPrompt} Featuring: ${carName}. Accurate vehicle representation and clean production quality.`,
          imageSize,
          aspectRatio: '16:9',
        }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setCurrentRenderUrl(data.imageUrl);
        setGallery((prev) => [
          {
            url: data.imageUrl,
            title: `${carName} (${imageSize})`,
            size: imageSize,
          },
          ...prev,
        ]);
      } else {
        setRenderError(data.error || t.renderFailed);
      }
    } catch (err) {
      console.error(err);
      setRenderError(t.renderFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadExtension = currentRenderUrl.startsWith('data:image/png') ? 'png' : 'jpg';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.studioTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t.studioSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 px-2">{t.resolutionSelector}:</span>
          {(['1K', '2K', '4K'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setImageSize(size)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                imageSize === size
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {renderError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
          <Layers className="w-4 h-4 shrink-0" />
          <span>{renderError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
            <label className="block text-slate-700 font-bold">{t.selectFleetVehicle}</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(e.target.value);
                const veh = vehicles.find((v) => v.id === e.target.value);
                if (veh) {
                  setCurrentRenderUrl(veh.image_url);
                  setCustomPrompt(
                    `Studio automotive photography of a ${veh.year} ${veh.make} ${veh.model} in ${veh.color}. Studio lighting, reflective showroom floor, 8k catalog quality.`
                  );
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.color})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
            <label className="block text-slate-700 font-bold">{t.lightingTheme}</label>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectTheme(item)}
                  className={`p-2.5 rounded-lg text-left rtl:text-right border transition-all ${
                    theme === item.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
            <label className="block text-slate-700 font-bold">{t.studioPrompt}</label>
            <textarea
              rows={4}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 leading-relaxed"
            />

            <button
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full py-3 px-4 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.renderInProgress}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.generateRender} ({imageSize})</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg relative aspect-[16/9] flex items-center justify-center">
            {isGenerating && (
              <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <div className="text-sm font-bold text-slate-100">{t.renderInProgress}</div>
              </div>
            )}

            <img
              src={currentRenderUrl}
              alt="Studio Render"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />

            <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs text-white font-mono text-xs font-bold border border-white/20">
              {imageSize}
            </div>

            <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl text-white flex items-center justify-between">
              <span className="text-xs truncate max-w-md font-medium">
                {customPrompt.slice(0, 75)}...
              </span>
              <a
                href={currentRenderUrl}
                download={`autobi_studio_render.${downloadExtension}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-white hover:bg-slate-200 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.downloadAsset}</span>
              </a>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <span>{t.marketingGallery}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gallery.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentRenderUrl(item.url)}
                  className={`rounded-lg overflow-hidden border cursor-pointer group relative aspect-[16/10] bg-slate-100 transition-all ${
                    currentRenderUrl === item.url ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 text-white">
                    {item.size}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
