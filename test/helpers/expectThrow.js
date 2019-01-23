module.exports = async promise => {
    try {
      await promise;
    } catch (error) {
      const invalidAddress = error.message.search('invalid address') >= 0;
      assert(
        invalidAddress,
        "Expected throw, got '" + error + "' instead",
      );
      return;
    }
    assert.fail('Expected throw not received');
  };