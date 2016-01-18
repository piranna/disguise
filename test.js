var assert = require('assert')

var disguise = require('./index')


describe('disguise', function()
{
  it('source is undefined', function()
  {
    var disguised = disguise({})

    assert.deepStrictEqual(disguised, {})
  })

  it('only enumerable properties are added', function()
  {
    var expected = {enumerable: 'qwerty'}
    Object.defineProperty(expected, 'notEnumerable', {value: 'qwerty'})

    var disguised = disguise({}, expected)

    assert.deepStrictEqual(disguised.enumerable, expected.enumerable)
    assert.deepStrictEqual(disguised.notEnumerable, undefined)
  })

  it('enumerable properties are still enumerable', function()
  {
    var expected = {asdf: 'qwerty'}

    var disguised = disguise({}, expected)

    assert.deepStrictEqual(disguised, expected)
  })
})
