import { toBlob } from "html-to-image";

/**
 * Captura um nó DOM como PNG. Aguarda `document.fonts.ready` antes de
 * capturar para evitar fallback visual de fontes ainda não carregadas
 * (ex: Poppins/Inter) no momento do snapshot.
 */
export async function exportNodeToPngBlob(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;

  const blob = await toBlob(node, { pixelRatio: 2 });

  if (!blob) {
    throw new Error("Failed to export image");
  }

  return blob;
}

/**
 * Compartilha a imagem via Web Share API quando disponível (mobile), ou
 * cai para download direto via link `<a download>` (desktop / fallback).
 */
export async function shareOrDownloadImage(
  blob: Blob,
  filename: string,
): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: blob.type });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: filename });
    return "shared";
  }

  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);

  return "downloaded";
}
