module.exports = [dateInData];

// Test that JSON-S properly serializes the `Date` type.
async function dateInData({ server, browserEval }) {
  server.mirrorDate = async function (date) {
    return date;
  };

  await browserEval(async () => {
    const today = new Date();
    const today_copy = await window.telefunc.server.mirrorDate(today);
    assert(today !== today_copy);
    assert(today_copy.constructor === Date);
    assert(today.getTime() === today_copy.getTime());
  });
}
