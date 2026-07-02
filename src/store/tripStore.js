import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Persisted to sessionStorage so a mid-trip page refresh doesn't bounce the
// user back to the join screen to re-enter their name and code
const useTripStore = create(persist((set) => ({
  myName:        '',
  myTransport:   'car',
  myColor:       '',
  memberId:      '',
  tripCode:      '',
  myPos:         null,
  activePanel:   null,
  unreadMessages: 0,
  sosActive:     false,
  tripStartTime: null,
  isObserver:    false,
  isCreator:     false,   // true when current user created the trip
  isSharing:     true,    // ghost mode: false pauses location sharing
  showInvite:    false,   // opens the invite sheet (auto-set after creating)
  tripName:      '',      // from meta
  tripMode:      'everyone', // 'everyone' | 'hub' | 'proximity' (from meta)
  organizerId:   '',      // meta.createdBy
  routePath:     null,    // Array<{lat,lng}> overview path from Directions API
  mapsLoaded:    false,   // true once the Google Maps script is ready

  setMyInfo:       (name, transport) => set({ myName: name, myTransport: transport }),
  setTripCode:     (code)  => set({ tripCode: code }),
  setMyPos:        (pos)   => set({ myPos: pos }),
  setMemberId:     (id)    => set({ memberId: id }),
  setMyColor:      (color) => set({ myColor: color }),
  setActivePanel:  (panel) => set({ activePanel: panel }),
  incrementUnread: ()      => set(s => ({ unreadMessages: s.unreadMessages + 1 })),
  clearUnread:     ()      => set({ unreadMessages: 0 }),
  triggerSOS:      ()      => set({ sosActive: true }),
  setObserver:     (bool)  => set({ isObserver: bool }),
  setTripStartTime:(time)  => set({ tripStartTime: time }),
  setIsCreator:    (bool)  => set({ isCreator: bool }),
  setSharing:      (bool)  => set({ isSharing: bool }),
  setShowInvite:   (bool)  => set({ showInvite: bool }),
  setTripMeta:     (meta)  => set({
    tripName:    meta?.name ?? '',
    tripMode:    meta?.mode ?? 'everyone',
    organizerId: meta?.createdBy ?? '',
  }),
  setRoutePath:    (path)  => set({ routePath: path }),
  setMapsLoaded:   (bool)  => set({ mapsLoaded: bool }),

  reset: () => set({
    myName:         '',
    myTransport:    'car',
    myColor:        '',
    memberId:       '',
    tripCode:       '',
    myPos:          null,
    activePanel:    null,
    unreadMessages: 0,
    sosActive:      false,
    tripStartTime:  null,
    isObserver:     false,
    isCreator:      false,
    isSharing:      true,
    showInvite:     false,
    tripName:       '',
    tripMode:       'everyone',
    organizerId:    '',
    routePath:      null,
    mapsLoaded:     false,
  }),
}), {
  name:    'convoy-trip',
  storage: createJSONStorage(() => sessionStorage),
  partialize: s => ({
    myName:        s.myName,
    myTransport:   s.myTransport,
    myColor:       s.myColor,
    memberId:      s.memberId,
    tripCode:      s.tripCode,
    isObserver:    s.isObserver,
    isCreator:     s.isCreator,
    isSharing:     s.isSharing,
    tripStartTime: s.tripStartTime,
  }),
}))

export default useTripStore
