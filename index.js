/*
 * (C) Copyright 2015 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the GNU Lesser General Public License (LGPL)
 * version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */


/*
 * Disguise an object giving it the appearance of another
 *
 * Add bind'ed functions and properties to a `target` object delegating the
 * actions and attributes updates to the `source` one while retaining its
 * original personality (i.e. duplicates and `instanceof` are preserved)
 *
 * @param {Object} target - the object to be disguised
 * @param {Object} source - the object where to fetch its methods and attributes
 *
 * @return {Object} `target` disguised
 */
function disguise(target, source) {
  for (var key in source) {
    if (target[key] !== undefined) continue

    if (typeof source[key] === 'function')
      Object.defineProperty(target, key, {
        value: source[key].bind(source)
      })
    else
      Object.defineProperty(target, key, {
        get: function () {
          return source[key]
        },
        set: function (value) {
          source[key] = value
        }
      })
  }

  return target
}

/*
 * Disguise a thenable object
 *
 * If available, `target.then()` gets replaced by a method that exec the
 * `onFulfilled` and `onRejected` callbacks using `source` as `this` object, and
 * return the Promise returned by the original `target.then()` method already
 * disguised. It also add a `target.catch()` method pointing to the newly added
 * `target.then()`, being it previously available or not.
 *
 * @param {thenable} target - the object to be disguised
 * @param {Object} source - the object where to fetch its methods and attributes
 *
 * @return {thenable} `target` disguised
 */
function disguiseThenable(target, source)
{
  if(target.then instanceof Function)
  {
    var target_then = target.then

    function then(onFulfilled, onRejected)
    {
      if(onFulfilled != null) onFulfilled = onFulfilled.bind(source)
      if(onRejected  != null) onRejected  = onRejected .bind(source)

      var promise = target_then.call(target, onFulfilled, onRejected)

      return disguiseThenable(promise, source)
    }

    target.then  = then
    target.catch = then.bind(target, null)
  }

   return disguise(target, source)
 }


disguise.disguise         = disguise
disguise.disguiseThenable = disguiseThenable


module.exports = disguise
