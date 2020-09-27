import * as pull from 'pull-stream'
import { noop, trueToNull } from './utils'
import { pushable, Read } from '@jacobbubu/pull-pushable'
import { AbortableSink, abortableSink, OnReceivedCallback } from './sink'

export type OnReadCallback<In> = (end?: pull.EndOrError, data?: In) => void

export interface DuplexOptions<In, Out> {
  allowHalfOpen: boolean
  abortEagerly: boolean
  onReceived: (this: PushableDuplex<In, Out>, data: Out, cb?: OnReceivedCallback) => void
  onRead: (this: PushableDuplex<In, Out>, cb: OnReadCallback<In>) => void
  onSent: (data: In) => void
  onFinished: (err: pull.EndOrError) => void
}

export class PushableDuplex<In, Out> implements pull.Duplex<In, Out> {
  private _source: Read<In> | null = null
  private _sink: AbortableSink<Out> | null = null
  private _rawSinkRead: pull.Source<Out> | null = null

  protected readonly sourceCbs: pull.SourceCallback<In>[] = []

  public readonly buffer: In[] = []

  constructor(private _opts: Partial<DuplexOptions<In, Out>> = {}) {
    _opts.allowHalfOpen = _opts.allowHalfOpen ?? false
    _opts.abortEagerly = _opts.abortEagerly ?? false
  }

  get source() {
    if (!this._source) {
      const self = this
      this._source = pushable(
        (end) => {
          console.log('self opts', self._opts)
          if (!self._opts.allowHalfOpen) {
            end = end ?? true
            console.log(new Date(), 'source closed, trigger sink end', end)
            self._opts.abortEagerly ? self.sink.abort(end) : self.sink.end(end)
            console.log('sink', self._sink?.finished())
          }
          self.finish()
        },
        undefined,
        this._opts.onRead?.bind(self)
      )
    }
    return this._source
  }

  get sink(): AbortableSink<Out> {
    if (!this._sink) {
      const self = this
      this._sink = abortableSink(this._opts.onReceived!.bind(self), (end) => {
        end = end ?? true
        if (!self._opts.allowHalfOpen) {
          self._opts.abortEagerly ? self._source?.abort(end) : self._source?.end(end)
        }
        self.finish()
      })
    }
    return this._sink
  }

  push(data: In) {
    return this._source?.push(data)
  }

  end(end?: pull.EndOrError) {
    this._source?.end(end)
    this._sink?.end(end)
  }

  abort(end?: pull.EndOrError) {
    this._source?.abort(end)
    this._sink?.abort(end)
  }

  private finish() {
    console.log(
      new Date(),
      'finished, source',
      this._source?.finished(),
      'sink',
      this._sink?.finished()
    )
    if (this._source?.finished() && this.sink?.finished()) {
      console.log(new Date(), 'source.finished', this._source.finished())
      console.log(new Date(), 'sink.finished', this._sink?.finished())
      const err = trueToNull(this._source?.finished()) || trueToNull(this._sink?.finished()!)
      this._opts.onFinished?.(err)
    }
  }
}
