// Mock for query-string module
const queryString = {
  parse: jest.fn((str) => {
    const params = {};
    if (typeof str !== 'string') return params;
    
    // Simple implementation
    const parts = str.replace(/^\?/, '').split('&');
    for (const part of parts) {
      if (!part) continue;
      const [key, value] = part.split('=');
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
    return params;
  }),
  
  stringify: jest.fn((obj) => {
    if (!obj || typeof obj !== 'object') return '';
    
    // Simple implementation
    return Object.keys(obj)
      .filter(key => obj[key] !== undefined && obj[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
      .join('&');
  }),
  
  parseUrl: jest.fn((url) => {
    if (typeof url !== 'string') return { url: '', query: {} };
    
    const [urlPart, queryPart] = url.split('?');
    return {
      url: urlPart,
      query: queryPart ? queryString.parse(queryPart) : {}
    };
  })
};

module.exports = queryString; 
