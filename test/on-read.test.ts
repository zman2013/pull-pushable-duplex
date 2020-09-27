import * as pull from 'pull-stream'
import { PushableDuplex } from '../src'
import { getProbe, valuesToRead } from './common'

describe('onRead', () => {
  it('using push', (done) => {
    const s1Values = [1, 2, 3]
    let idx = 0
    const s2Values = ['a', 'b', 'c']
    const results: any[] = []
    const d = new PushableDuplex({
      allowHalfOpen: true,
      onRead: function (cb) {
        if (idx < s1Values.length) {
          // no data provided in cb
          this.push(s1Values[idx++])
          cb()
        } else {
          cb(true)
        }
      },
      onReceived: (data, cb) => {
        results.push(data)
        cb?.()
      },
      onFinished: (err) => {
        expect(err).toBeNull()
        expect(results).toEqual(s2Values)
        done()
      },
    })
    const peer = {
      source: pull(
        pull.values(s2Values),
        getProbe(),
        pull.asyncMap((data, cb) => {
          setTimeout(() => {
            cb(null, data)
          }, 50)
        })
      ),
      sink: pull(
        getProbe(),
        pull.collect((err, results) => {
          expect(err).toBeFalsy()
          expect(results).toEqual(s1Values)
        })
      ),
    }
    pull(d, peer, d)
  })
})
