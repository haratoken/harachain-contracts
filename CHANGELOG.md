# Harachain Smart Contracts Change Log

# 2019-08-18
## New Contract
- ens/ENS: Ethereum name services abstraction.
- ens/HNS: Hara Name Services Registry contract.
- ens/HaraRegistrar: Registrar to regist new node by staking with hart.
- ens/OwnerRegistrar: Registrar to regist new node by owner only.
- ens/HaraResolver: Contract to keep all resolvers of nodes.
- DataFactoryProvider: Contract to add data store relation version and it's value.
- DataProviderNull: Data provider that return null URI.
- DataProviderProxy: A proxy contract for curren tactive data provider.
- DataProviderRelation: Data provider that keep relation of data store.

## Contract Changes
- [IDataProvider ] Changes `_priceId` parameter to `version`.
- [Attest Contract] Implement EIP-780.
- [Data Store] Changes `signature` storage from `bytes` to `mapping(bytes32=>bytes)`.
- [Data Store] Add `editor` to allow DataFactoryProvider add new version.


# 2019-07-02
## New Contract
- Data Provider Null Contract: A data provider contract that only return empty endpoint.
- Data Provider Proxy: A proxy for calling other Data Provider Contract.
- Data Provider Abstract: Abstract contract that can be use woth other data provider contract.
## Contract Changes
- [Data Provider Hara] Implement Data Provider Abstract
