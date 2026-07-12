import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';

export const useThemeRefresh = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, [theme]);

  return refreshKey;
};
