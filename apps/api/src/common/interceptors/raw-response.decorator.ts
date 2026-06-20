import { SetMetadata } from "@nestjs/common";

export const IS_RAW_RESPONSE_KEY = "isRawResponse";

/** Marca rota/controller cujo retorno não deve ser envolvido em { data, error } (ex: /metrics). */
export const RawResponse = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_RAW_RESPONSE_KEY, true);
