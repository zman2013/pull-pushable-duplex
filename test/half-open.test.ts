import * as pull from 'pull-stream'
import { PushableDuplex } from '../src'
import { getProbe, valuesToRead } from './common'

describe('half-open', () => {
  it('allow half-open', (done) => {
    const s1Values = [1, 2, 3]
    const s2Values = ['a', 'b', 'c']
    const results: any[] = []
    const d = new PushableDuplex({
      allowHalfOpen: true,
      onRead: valuesToRead(s1Values, 10),
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

  it('disallow half-open: slow source', (done) => {
    const s1Values = [1, 2, 3]
    const s2Values = ['a', 'b', 'c']
    const results: any[] = []
    const d = new PushableDuplex({
      allowHalfOpen: false,
      onRead: valuesToRead(s1Values, 50),
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
          expect(results).toEqual([])
        })
      ),
    }
    pull(d, peer, d)
  })

  it('disallow half-open: slow sink', (done) => {
    const s1Values = [1, 2, 3]
    const s2Values = ['a', 'b', 'c']
    const results: any[] = []
    const d = new PushableDuplex({
      allowHalfOpen: false,
      onRead: valuesToRead(s1Values),
      onReceived: (data) => {
        results.push(data)
      },
      onFinished: (err) => {
        expect(err).toBeNull()
        expect(results).toEqual([])
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
          }, 500)
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
