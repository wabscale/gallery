import { useState, useEffect, useCallback, useRef } from 'react';
import { galleriesAPI, imagesAPI } from '../../../services/api';

const SAVE_DELAY = 800;

// Batches field edits into a single debounced save.
// saveState drives the header indicator: saved | pending | saving | error.
const useAutosave = (id, setGallery, refreshGallery, setError) => {
  const [saveState, setSaveState] = useState('saved');
  const saveTimeoutRef = useRef(null);
  const pendingChangesRef = useRef({});

  const saveChanges = useCallback(async (changes) => {
    setError('');
    setSaveState('saving');
    try {
      await galleriesAPI.update(id, changes);
      // Another edit may have queued while this request was in flight
      setSaveState(Object.keys(pendingChangesRef.current).length ? 'pending' : 'saved');
      if ('image_sort' in changes) {
        await refreshGallery();
      }
    } catch (err) {
      setSaveState('error');
      setError(err.response?.data?.error || 'Failed to save');
    }
  }, [id, refreshGallery, setError]);

  const handleChange = useCallback((field, value) => {
    setGallery((prev) => ({ ...prev, [field]: value }));
    pendingChangesRef.current = { ...pendingChangesRef.current, [field]: value };
    setSaveState('pending');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const changes = pendingChangesRef.current;
      pendingChangesRef.current = {};
      saveChanges(changes);
    }, SAVE_DELAY);
  }, [saveChanges, setGallery]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return { saveState, handleChange };
};

const useGalleryData = (id, setError) => {
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    galleriesAPI.get(id)
      .then((response) => setGallery(response.data))
      .catch(() => setError('Failed to load gallery'))
      .finally(() => setLoading(false));
  }, [id, setError]);

  const refreshGallery = useCallback(async () => {
    try {
      const response = await galleriesAPI.get(id);
      setGallery(response.data);
    } catch {
      setError('Failed to refresh gallery');
    }
  }, [id, setError]);

  const { saveState, handleChange } = useAutosave(id, setGallery, refreshGallery, setError);

  return { gallery, setGallery, loading, saveState, refreshGallery, handleChange };
};

const useImageActions = (id, gallery, setGallery, { setError, setToast }) => {
  const setCover = async (imageId) => {
    const newCoverId = gallery.cover_image_id === imageId ? null : imageId;
    try {
      await galleriesAPI.update(id, { cover_image_id: newCoverId });
      setGallery((prev) => ({ ...prev, cover_image_id: newCoverId }));
      setToast(newCoverId ? 'Cover image set' : 'Cover image removed');
    } catch {
      setError('Failed to update cover image');
    }
  };

  const toggleVisibility = async (imageId, currentlyHidden) => {
    try {
      await imagesAPI.updateVisibility(imageId, !currentlyHidden);
      setGallery((prev) => ({
        ...prev,
        images: prev.images.map((img) => (img.id === imageId ? { ...img, is_hidden: !currentlyHidden } : img)),
      }));
    } catch {
      setError('Failed to update image visibility');
    }
  };

  const deleteImage = async (imageId) => {
    try {
      await imagesAPI.delete(imageId);
      setGallery((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
        image_count: prev.image_count - 1,
        cover_image_id: prev.cover_image_id === imageId ? null : prev.cover_image_id,
      }));
      setToast('Image deleted');
    } catch {
      setError('Failed to delete image');
    }
  };

  const deleteAllImages = async () => {
    try {
      await imagesAPI.deleteAll(id);
      setGallery((prev) => ({ ...prev, images: [], image_count: 0, cover_image_id: null }));
      setToast('All images deleted');
    } catch {
      setError('Failed to delete images');
    }
  };

  return { setCover, toggleVisibility, deleteImage, deleteAllImages };
};

export const useGalleryEditor = (id) => {
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const data = useGalleryData(id, setError);
  const imageActions = useImageActions(id, data.gallery, data.setGallery, { setError, setToast });

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/gallery/${data.gallery.slug}`);
    setToast('Link copied');
  }, [data.gallery]);

  return { ...data, ...imageActions, copyLink, error, setError, toast, setToast };
};
