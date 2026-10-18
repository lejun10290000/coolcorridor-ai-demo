/** Field-aware domain error; UI may focus a field without changing the model's message. */
export class ObservationValidationError extends Error {
  constructor(public field: string, message: string) { super(message); this.name='ObservationValidationError' }
}
export function requireObservationField(condition:unknown,field:string,message:string):void {
  if(!condition)throw new ObservationValidationError(field,message)
}
export function observationLocalTimestamp(value:string) {
  return value.length===16?`${value}:00+08:00`:value?`${value}+08:00`:''
}
