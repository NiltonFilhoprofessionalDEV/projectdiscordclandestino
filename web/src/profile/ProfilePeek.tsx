import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ImageLightbox } from "../components/media/ImageLightbox.tsx";
import { ViewProfileDialog } from "../components/profile/ViewProfileDialog.tsx";

type ProfilePeekValue = {
  openUser: (userId: string) => void;
  openImage: (src: string, alt?: string) => void;
};

const ProfilePeekContext = createContext<ProfilePeekValue>({
  openUser: () => undefined,
  openImage: () => undefined,
});

export function useProfilePeek(): ProfilePeekValue {
  return useContext(ProfilePeekContext);
}

export function ProfilePeekProvider({
  children,
  onEditSelf,
}: {
  children: ReactNode;
  onEditSelf?: () => void;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);

  const openUser = useCallback((id: string) => {
    setUserId(id);
  }, []);
  const openImage = useCallback((src: string, alt = "Foto") => {
    setImage({ src, alt });
  }, []);

  const value = useMemo(() => ({ openUser, openImage }), [openImage, openUser]);

  return (
    <ProfilePeekContext.Provider value={value}>
      {children}
      <ViewProfileDialog
        userId={userId}
        onClose={() => setUserId(null)}
        onOpenImage={openImage}
        onEditSelf={
          onEditSelf
            ? () => {
                setUserId(null);
                onEditSelf();
              }
            : undefined
        }
      />
      <ImageLightbox
        src={image?.src ?? null}
        alt={image?.alt ?? ""}
        onClose={() => setImage(null)}
      />
    </ProfilePeekContext.Provider>
  );
}
