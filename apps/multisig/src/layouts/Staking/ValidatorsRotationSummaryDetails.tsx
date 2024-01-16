import { bondedPoolsState } from '@domains/staking'
import { useEffect, useMemo, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { Identicon, Skeleton } from '@talismn/ui'
import AddressTooltip from '@components/AddressTooltip'
import { Chain } from '@domains/chains'
import { Validator, validatorsState } from '@domains/staking/ValidatorsWatcher'
import { shortenAddress } from '@util/addresses'
import { Transaction, useSelectedMultisig } from '@domains/multisig'
import { useNomPoolOf } from '@domains/staking/useNomPool'
import { useNominations } from '@domains/staking/useNominations'

export const NominationCard: React.FC<{
  address: string
  validators?: Record<string, Validator>
  chain: Chain
}> = ({ validators, address, chain }) => {
  const validator = validators?.[address]

  return (
    <AddressTooltip
      address={address}
      name={
        validator?.name || validator?.subName
          ? `${validator.name}${validator.subName ? ` / ${validator.subName}` : ''}`
          : undefined
      }
      chain={chain}
    >
      <div className="flex items-center overflow-hidden w-full gap-[8px] px-[8px] py-[4px] bg-gray-500 rounded-[8px] h-[44px] text-left">
        <Identicon value={address} size={20} className="min-w-[20px]" />
        <div className="overflow-hidden w-full">
          <p className="text-offWhite text-[14px]  whitespace-nowrap overflow-hidden text-ellipsis">
            {validator?.name ?? shortenAddress(address)}
          </p>
          {validator?.subName !== undefined && (
            <p className="text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">/ {validator.subName}</p>
          )}
        </div>
      </div>
    </AddressTooltip>
  )
}

export const ValidatorsRotationHeader: React.FC<{ t: Transaction }> = ({ t }) => {
  const [selectedMultisig] = useSelectedMultisig()
  const pool = useNomPoolOf(selectedMultisig.proxyAddress)
  const { nominations: nomPoolNominations } = useNominations(
    selectedMultisig.chain,
    pool?.pool.stash.toSs58(selectedMultisig.chain)
  )

  const bondedPools = useRecoilValue(bondedPoolsState)
  const [cachedNominations, setCachedNominations] = useState(nomPoolNominations?.map(({ address }) => address))

  const nominatedPool = useMemo(() => {
    if (t.decoded?.nominate?.poolId === undefined) return null
    if (bondedPools === undefined) return undefined
    return bondedPools.poolsMap[t.decoded?.nominate?.poolId]
  }, [bondedPools, t.decoded?.nominate?.poolId])

  const newNominations = useMemo(() => {
    return t.decoded?.nominate?.validators ?? []
  }, [t.decoded?.nominate?.validators])

  const addedNominations = useMemo(() => {
    const added: string[] = []
    newNominations.forEach(addedAddress => {
      if (!cachedNominations?.includes(addedAddress)) added.push(addedAddress)
    })
    return added
  }, [cachedNominations, newNominations])

  const removedNominations = useMemo(() => {
    const removed: string[] = []
    cachedNominations?.forEach(removedAddress => {
      if (!newNominations.includes(removedAddress)) removed.push(removedAddress)
    })
    return removed
  }, [cachedNominations, newNominations])

  const changed = addedNominations.length > 0 || removedNominations.length > 0

  useEffect(() => {
    if (cachedNominations !== undefined) return
    setCachedNominations(nomPoolNominations?.map(({ address }) => address) ?? [])
  }, [cachedNominations, nomPoolNominations])

  return (
    <div className="flex items-center gap-[8px]">
      {nominatedPool === null ? null : nominatedPool === undefined ? (
        <Skeleton.Surface className="h-[21px] w-[100px]" />
      ) : (
        <AddressTooltip
          address={nominatedPool.stash}
          name={`Pool #${nominatedPool.id} (Stash)`}
          chain={selectedMultisig.chain}
        >
          <div className="flex items-center bg-gray-500 gap-[4px] px-[8px] rounded-[8px]">
            <Identicon size={14} value={nominatedPool.stash.toSs58()} />
            <p className="text-offWhite text-[14px] mt-[2px]">Pool #{nominatedPool.id}</p>
          </div>
        </AddressTooltip>
      )}
      <p>
        {addedNominations.length > 0 && <span className="text-green-500">+ {addedNominations.length}</span>}{' '}
        {removedNominations.length > 0 && <span className="text-red-400">- {removedNominations.length}</span>}{' '}
        {changed && <span>Validators</span>}
      </p>
    </div>
  )
}

export const ValidatorsRotationExpandedDetails: React.FC<{ t: Transaction }> = ({ t }) => {
  const [selectedMultisig] = useSelectedMultisig()
  const pool = useNomPoolOf(selectedMultisig.proxyAddress)
  const validators = useRecoilValue(validatorsState)
  const { nominations: nomPoolNominations } = useNominations(
    selectedMultisig.chain,
    pool?.pool.stash.toSs58(selectedMultisig.chain)
  )
  const [cachedNominations, setCachedNominations] = useState(nomPoolNominations?.map(({ address }) => address))

  const newNominations = useMemo(() => {
    return t.decoded?.nominate?.validators ?? []
  }, [t.decoded?.nominate?.validators])

  const addedNominations = useMemo(() => {
    const added: string[] = []
    newNominations.forEach(addedAddress => {
      if (!cachedNominations?.includes(addedAddress)) added.push(addedAddress)
    })
    return added
  }, [cachedNominations, newNominations])

  const removedNominations = useMemo(() => {
    const removed: string[] = []
    cachedNominations?.forEach(removedAddress => {
      if (!newNominations.includes(removedAddress)) removed.push(removedAddress)
    })
    return removed
  }, [cachedNominations, newNominations])

  const changed = addedNominations.length > 0 || removedNominations.length > 0

  useEffect(() => {
    if (cachedNominations !== undefined) return
    setCachedNominations(nomPoolNominations?.map(({ address }) => address))
  }, [cachedNominations, nomPoolNominations])

  return (
    <div className="grid gap-[16px]">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-gray-200 text-[16px]">{changed && 'New '}Nominated Validators</p>
          <div className="text-primary bg-primary/20 text-[14px] py-[4px] px-[8px] rounded-[6px]">
            {newNominations.length} Validators
          </div>
        </div>
        <div className="grid grid-cols-4 gap-[8px] mt-[8px]">
          {newNominations.map(addr => (
            <NominationCard
              key={addr}
              address={addr}
              chain={selectedMultisig.chain}
              validators={validators?.validators}
            />
          ))}
        </div>
      </div>
      {addedNominations.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-gray-200 text-[16px]">Added Validators</p>
            <div className="text-green-500 bg-green-400/20 text-[14px] py-[4px] px-[8px] rounded-[6px]">
              {addedNominations.length} Added
            </div>
          </div>
          <div className="grid grid-cols-4 gap-[8px] mt-[8px]">
            {addedNominations.map(addr => (
              <NominationCard
                key={addr}
                address={addr}
                chain={selectedMultisig.chain}
                validators={validators?.validators}
              />
            ))}
          </div>
        </div>
      )}
      {removedNominations.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-gray-200 text-[16px]">Removed Validators</p>
            <div className="text-red-500 bg-red-400/20 text-[14px] py-[4px] px-[8px] rounded-[6px]">
              {removedNominations.length} Removed
            </div>
          </div>
          <div className="grid grid-cols-4 gap-[8px] mt-[8px]">
            {removedNominations.map(addr => (
              <NominationCard
                key={addr}
                address={addr}
                chain={selectedMultisig.chain}
                validators={validators?.validators}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
