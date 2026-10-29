import { useSearchParams } from 'react-router-dom';

// List filters live in the URL so they survive reloads and can be linked to.
export function useListParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = { page: 1, ...defaults, ...Object.fromEntries(searchParams) };
  params.page = Number(params.page) || 1;

  const update = (changes) => {
    const next = { ...params, ...changes };
    if (!('page' in changes)) next.page = 1;
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '' && v != null));
    setSearchParams(clean, { replace: true });
  };

  return [params, update];
}
