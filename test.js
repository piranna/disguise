var assert = require('assert')

var disguise = require('./index')


describe('disguise', function()
{
  it('do nothing when source is undefined', function()
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

  it('methods exec on the disguised object context', function()
  {
    var source =
    {
      method: function(callback)
      {
        callback(this)
      }
    }

    var disguised = disguise({}, source)

    disguised.method(function(thisArg)
    {
      assert.deepStrictEqual(thisArg, disguised)
    })
  })

  it('priviledged methods can still access private values', function()
  {
    var expected = 1

    var source = new function()
    {
      var priv = 0

      this.set = function(value){priv = value}
      this.get = function(){return priv}
    }

    var disguised = disguise({}, source)

    disguised.set(expected)

    assert.deepStrictEqual(source.get(), expected)
  })
})

describe('disguiseThenable', function()
{
  it('promise callbacks exec on the disguised object context', function(done)
  {
    var promise = Promise.resolve()

    var disguised = disguise.disguiseThenable(promise, {})

    disguised.then(function()
    {
      assert.deepStrictEqual(this, disguised)
      done()
    },
    done)
  })

  it('respect thenable chaining', function(done)
  {
    var result = []

    var promise = new Promise(function(resolve)
    {
      setTimeout(function()
      {
        result.push(1)
        resolve()
      }, 10)
    })

    var source =
    {
      method2: function()
      {
        var promise = this.then(function()
        {
          return new Promise(function(resolve)
          {
            setTimeout(function()
            {
              result.push(2)
              resolve()
            }, 10)
          })
        })

        return promise
      },
      method4: function()
      {
        var promise = this.then(function()
        {
          return new Promise(function(resolve)
          {
            setTimeout(function()
            {
              result.push(4)
              resolve()
            }, 10)
          })
        })

        return promise
      }
    }

    var disguised = disguise.disguiseThenable(promise, source)

    disguised
    .method2()
    .then(function()
    {
      result.push(3)
    })
    .method4()
    .then(function()
    {
      assert.deepStrictEqual(result, [1,2,3,4])
    })
    .then(done, done)
  })
})

describe('unthenable', function()
{
  it('undefined', function()
  {
    let unthenabled = disguise.unthenable()

    assert.strictEqual(unthenabled, undefined)
  })

  it('`.then()` and `.catch()` should be removed', function()
  {
    let promise = Promise.resolve()
        promise.foo = 'bar'

    assert.ok(promise.then instanceof Function)
    assert.ok(promise.catch instanceof Function)

    let unthenabled = disguise.unthenable(promise)

    assert.notStrictEqual(unthenabled, promise)
    assert.strictEqual(unthenabled.then, undefined)
    assert.strictEqual(unthenabled.catch, undefined)
    assert.strictEqual(unthenabled.foo, 'bar')
  })

  it('copy attributes on prototype', function()
  {
    function A(){}
    A.prototype.foo = 'bar'
    A.prototype.then = function(){}

    let promise = new A()

    assert.ok(promise.then instanceof Function)

    let unthenabled = disguise.unthenable(promise)

    assert.notStrictEqual(unthenabled, promise)
    assert.strictEqual(unthenabled.then, undefined)
    assert.strictEqual(unthenabled.foo, 'bar')
  })
})
