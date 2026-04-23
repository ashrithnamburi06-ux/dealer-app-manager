export const getTokenFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
};