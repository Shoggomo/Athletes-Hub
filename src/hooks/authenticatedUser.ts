import {useAuthState} from "react-firebase-hooks/auth";
import {auth} from "../utils/firebase";
import {doc} from "firebase/firestore";
import db from "../utils/db";
import {useDocumentData} from "react-firebase-hooks/firestore";

function useAuthenticatedUser() {
    const [authUser, authLoading, authError] = useAuthState(auth)
    const [dbUser, dbLoading, dbError] = useDocumentData(authUser ? doc(db.users, authUser.uid) : null)

    const loading = authLoading || dbLoading
    const error = authError || dbError

    return [dbUser, loading, error] as const
}

export default useAuthenticatedUser