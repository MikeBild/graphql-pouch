module.exports = {
  lowerCaseFirstLetter: lowerCaseFirstLetter,
};

function lowerCaseFirstLetter(string) {
  return string[0].toLowerCase() + string.slice(1);
}
