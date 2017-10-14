export function* IdCreator() {
  let n = 0;
  while ( true ) { // eslint-disable-line no-constant-condition
    yield n++;
  }
}
