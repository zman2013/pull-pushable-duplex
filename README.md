# @jacobbubu/pull-pushable-duplex

[![Build Status](https://github.com/jacobbubu/pull-pushable-duplex/workflows/Build%20and%20Release/badge.svg)](https://github.com/jacobbubu/pull-pushable-duplex/actions?query=workflow%3A%22Build+and+Release%22)
[![Coverage Status](https://coveralls.io/repos/github/jacobbubu/pull-pushable-duplex/badge.svg)](https://coveralls.io/github/jacobbubu/pull-pushable-duplex)
[![npm](https://img.shields.io/npm/v/@jacobbubu/pull-pushable-duplex.svg)](https://www.npmjs.com/package/@jacobbubu/pull-pushable-duplex/)

> A helper class for constructing full/half pushable duplex in pull-stream manner.

## Intro.

Constructing a full-duplex, pushable duplex requires complex state management considerations.

Especially, you need to make sure that you follow the guidelines of the pull-stream ([pull-stream-protocol-checker](https://github.com/elavoie/pull-stream-protocol-checker)).

## Usage

``` ts
import * as pull from 'pull-stream'
import { PushableDuplex } from '@jacobbubu/pull-pushable-duplex'

function valuesToRead<T>(values: T[] = []) {
  let i = 0
  return (cb: OnReadCallback<T>) => {
    i === values.length ? cb(true) : cb(null, values[i])
    i += 1
  }
}

const results: any[] = []
const d = new PushableDuplex({
  allowHalfOpen: true,
  onRead: valuesToRead([1, 2, 3]),
  onReceived: (data) => {
    results.push(data)
  },
  onFinished: (err) => {
    console.log("we've" got, results)
  },
})
const peer = {
  source: pull.values(['a', 'b', 'c']),
  sink: pull.collect((err, results) => {
    console.log("peer's got", results)
  })
}
pull(d, peer, d)
```

