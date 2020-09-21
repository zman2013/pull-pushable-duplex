import * as pull from 'pull-stream'

export function noop() {
  /**/
}

export function trueToNull(endOrError: pull.EndOrError) {
  return endOrError === true ? null : endOrError
}
