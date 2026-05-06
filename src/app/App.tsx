import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { EmptyScene } from '@/scenes/EmptyScene';

export function App() {
  const { t, i18n } = useTranslation('common');
  const setLocale = useAppStore((s) => s.setLocale);

  function handleLocaleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lang = e.target.value;
    setLocale(lang);
    void i18n.changeLanguage(lang);
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b0b14] text-white">
      {/* Capa 3D — ocupa toda la pantalla */}
      <div className="absolute inset-0">
        <EmptyScene />
      </div>

      {/* HUD superpuesto */}
      <div className="relative z-10 flex flex-col items-start gap-2 p-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('appName')}</h1>
        <p className="text-sm text-gray-300">{t('tagline')}</p>

        <label htmlFor="locale-selector" className="sr-only">
          Idioma
        </label>
        <select
          id="locale-selector"
          value={i18n.language}
          onChange={handleLocaleChange}
          className="mt-2 rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white backdrop-blur"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Footer legal */}
      <footer className="fixed bottom-2 left-2 z-20 flex gap-3 text-xs text-white/60">
        <a href="/LICENSE" className="hover:text-white/90 transition-colors">
          Licencia código (AGPL-3.0)
        </a>
        <a href="/CREDITS.md" className="hover:text-white/90 transition-colors">
          Créditos
        </a>
      </footer>
    </div>
  );
}
