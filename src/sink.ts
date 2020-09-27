import { Read, State } from '@jacobbubu/pull-pushable'
import { endianness } from 'os'
import pull, { Abort, EndOrError, Sink, Source } from 'pull-stream'

export interface AbortableSink<T> {
  (read: pull.Source<T>): void

  end: (end?: EndOrError) => void
  abort: (end?: Abort) => void
  finished: () => EndOrError
}

export type OnReceivedCallback = (end?: EndOrError) => void
export type OnReceived<T> = (data: T, cb?: OnReceivedCallback) => void
export type OnClose = (end?: EndOrError) => void

export function abortableSink<T>(onReceived: OnReceived<T>, onClose: OnClose): AbortableSink<T> {
  let _state: State = new State({
    onEnd: onClose,
  })
  let _rawRead: Source<T> | null = null

  const sink: AbortableSink<T> = (read: Source<T>) => {
    _rawRead = read

    read(_state.finishing || _state.finished, function next(abort, data) {
      if (abort) {
        _state.ended(abort)
        return
      }
      if (onReceived.length === 1) {
        onReceived(data!)
        read(_state.finishing || _state.finished, next)
      } else {
        onReceived(data!, (end) => {
          if (end) {
            _state.askEnd(end)
          }
          read(_state.finishing || _state.finished, next)
        })
      }
    })
  }

  sink.end = (end: EndOrError = true) => {
    if (!_state.askEnd(end)) return

    console.log('ending sink', end)

    if (!_rawRead) {
      _state.ended(end)
    }
  }

  sink.abort = (abort: EndOrError = true) => {
    if (!_state.askAbort(abort)) return

    if (_rawRead) {
      _rawRead(abort, (end) => {
        _state.ended(end)
      })
    } else {
      _state.ended(abort)
    }
  }

  sink.finished = () => {
    console.log('state', _state.finishing)
    return _state.finished
  }

  return sink
}
