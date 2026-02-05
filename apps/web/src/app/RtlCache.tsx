import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';

/** Cache ל־LTR — ללא פלאגין */
const cacheLtr = createCache({ key: 'mui' });

/** Cache ל־RTL — עם stylis-plugin-rtl להפיכת margins/padding */
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

export { cacheLtr, cacheRtl };
