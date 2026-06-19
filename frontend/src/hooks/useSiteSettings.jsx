import { useState, useEffect, createContext, useContext } from 'react';
import { siteSettingsAPI } from '../services/api';

const SiteSettingsContext = createContext(null);

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }
  return context;
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    site_title: 'Photo Gallery',
    site_heading: 'Photo Gallery',
    gallery_card_aspect_ratio: '4x5',
    has_favicon: false
  });

  const loadSettings = async () => {
    try {
      const response = await siteSettingsAPI.getPublic();
      setSettings({
        site_title: response.data.site_title || 'Photo Gallery',
        site_heading: response.data.site_heading || 'Photo Gallery',
        gallery_card_aspect_ratio: response.data.gallery_card_aspect_ratio || '4x5',
        has_favicon: response.data.has_favicon
      });
    } catch {
      // keep defaults
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    document.title = settings.site_title;
  }, [settings.site_title]);

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (settings.has_favicon) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = `/api/favicon.ico?t=${Date.now()}`;
    } else if (link) {
      link.remove();
    }
  }, [settings.has_favicon]);

  return (
    <SiteSettingsContext.Provider value={{ settings, refresh: loadSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
