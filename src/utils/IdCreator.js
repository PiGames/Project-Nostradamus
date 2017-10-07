export const IdCreator = () => {
  let id = 0;

  return () => {
    return id++;
  };
};
