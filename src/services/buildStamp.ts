declare const __BUILD_STAMP__: string | undefined;

/** Which code this install is running: the commit it was built from, and the CI build number when there is one. */
export const BUILD_STAMP: string = typeof __BUILD_STAMP__ === 'string' ? __BUILD_STAMP__ : 'dev';
