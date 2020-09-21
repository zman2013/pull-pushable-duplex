import * as pull from 'pull-stream'
import { PushableDuplex } from '../src'
import { getProbe, valuesToRead } from './common'

describe('basic', () => {
  it('README', (done) => {
    const s1Values = [1, 2, 3]
    const s2Values = ['a', 'b', 'c']
    const results: any[] = []
    const d = new PushableDuplex({
      allowHalfOpen: true,
      onRead: valuesToRead(s1Values),
      onReceived: (data) => {
        results.push(data)
      },
      onFinished: (err) => {
        expect(err).toBeNull()
        expect(results).toEqual(s2Values)
        done()
      },
    })
    const peer = {
      source: pull(pull.values(s2Values), getProbe()),
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
