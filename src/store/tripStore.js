import { create } from 'zustand'

const useTripStore = create((set) => ({
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
  routePath:     null,    // Array<{lat,lng}> overview path from Directions API
  mapsLoaded:    false,   // true once LoadScript fires onLoad

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
    routePath:      null,
    mapsLoaded:     false,
  }),
}))

export default useTripStore
