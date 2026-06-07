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

  setMyInfo: (name, transport) => set({ myName: name, myTransport: transport }),
  setTripCode:      (code)   => set({ tripCode: code }),
  setMyPos:         (pos)    => set({ myPos: pos }),
  setMemberId:      (id)     => set({ memberId: id }),
  setMyColor:       (color)  => set({ myColor: color }),
  setActivePanel:   (panel)  => set({ activePanel: panel }),
  incrementUnread:  ()       => set(s => ({ unreadMessages: s.unreadMessages + 1 })),
  clearUnread:      ()       => set({ unreadMessages: 0 }),
  triggerSOS:       ()       => set({ sosActive: true }),
  setObserver:      (bool)   => set({ isObserver: bool }),
  setTripStartTime: (time)   => set({ tripStartTime: time }),
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
  }),
}))

export default useTripStore
