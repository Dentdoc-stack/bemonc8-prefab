'use client';

import { ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    siteName: string;
    coverPhoto?: string | null;
    beforePhoto?: string | null;
    afterPhoto?: string | null;
    photoFolderUrl?: string | null;
}

export default function PhotoModal({
    isOpen,
    onClose,
    siteName,
    coverPhoto,
    beforePhoto,
    afterPhoto,
    photoFolderUrl,
}: PhotoModalProps) {
    const hasPhotos = coverPhoto || beforePhoto || afterPhoto;

    if (!hasPhotos) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">{siteName} - Photos</DialogTitle>
                        {photoFolderUrl && (
                            <a
                                href={photoFolderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open Full Folder
                            </a>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Cover Photo */}
                    {coverPhoto && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Cover Photo</h3>
                            <div className="rounded-lg overflow-hidden border bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={coverPhoto}
                                    alt="Cover"
                                    className="w-full h-auto max-h-[400px] object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Before & After Comparison */}
                    {(beforePhoto || afterPhoto) && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Before & After Comparison</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Before Photo */}
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                                        Before
                                    </div>
                                    <div className="rounded-lg overflow-hidden border bg-muted aspect-video">
                                        {beforePhoto ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={beforePhoto}
                                                alt="Before"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gQmVmb3JlIFBob3RvPC90ZXh0Pjwvc3ZnPg==';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                                No Before Photo
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* After Photo */}
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                                        After
                                    </div>
                                    <div className="rounded-lg overflow-hidden border bg-muted aspect-video">
                                        {afterPhoto ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={afterPhoto}
                                                alt="After"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gQWZ0ZXIgUGhvdG88L3RleHQ+PC9zdmc+';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                                No After Photo
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
