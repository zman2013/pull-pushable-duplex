import * as pull from 'pull-stream'
import { PushableDuplex } from '../src'
import { getProbe, valuesToRead } from './common'

describe('onReceived', () => {
  it('async callback', (done) => {
    const testError = new Error('test error')
    const s1Values = [1, 2, 3]
    const s2Values = ['a', 'b', 'c']
    const results: any[] = []
    const d = new PushableDuplex({
      allowHalfOpen: true,
      onRead: valuesToRead(s1Values),
      onReceived: (data, cb) => {
        results.push(data)
        cb?.(testError)
      },
      onFinished: (err) => {
        expect(err).toBe(testError)
        expect(results).toEqual(s2Values.slice(0, 1))
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
