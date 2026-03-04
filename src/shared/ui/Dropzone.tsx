"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export default function Dropzone({
                                     onSelect,
                                     preview,
                                     error
                                 }: { onSelect: (file: File) => void; preview?: string; error?: string }) {
    const onDrop = useCallback(
        (accepted: File[]) => accepted[0] && onSelect(accepted[0]),
        [onSelect]
    );
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] }
    });

    return (
        <div
            {...getRootProps()}
            className="flex items-center justify-center h-48 w-full border-2 border-dashed border-gray-300 rounded-xl cursor-pointer relative"
        >
            <input {...getInputProps()} />
            {preview ? (
                <Image
                    src={preview}
                    alt="Preview"
                    width={300}
                    height={192}
                    className="object-contain rounded-lg"
                    style={{ height: "100%", width: "auto" }}
                />
            ) : (
                <span className="text-sm text-gray-500">
                    {isDragActive ? "Drop image…" : "Drop your image here, or Click to browse"}
                </span>
            )}
            {error && <p className="text-xs text-red-500 absolute -bottom-5">{error}</p>}
        </div>
    );
}
