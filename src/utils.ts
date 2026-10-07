import { ObjectId } from "mongodb";

export function getUserID(id: string)
{
  let rawId = id;

  //extract just the 24 hex characters out of the string wrapper

  if (typeof rawId === 'string' && rawId.includes('ObjectId')) {
    const match = rawId.match(/[0-9a-fA-F]{24}/);
    rawId = match ? match[0] : rawId;
  }

  return typeof rawId === 'string' ? new ObjectId(rawId.trim()) : rawId;
}


//-----------------------------------------------