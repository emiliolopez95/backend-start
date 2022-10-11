import mysql from '../../../common/mysql_worker';
import { getAuth } from 'firebase-admin/auth';
import { IApiResponse } from '../../../common/apiTypes';
import { usePrisma } from '../..';

export default async function createAccount({ params }): Promise<IApiResponse> {
    const aurora = mysql();
    const { firstName, lastName, email, password, accountName } = params;

    if (!email || !password) {
        return { error: { message: 'Need email and password.' } };
    }

    let userWithEmail = await usePrisma.user.findFirst({ where: { email: email } });

    if (userWithEmail) {
        return { error: { message: 'Email already belongs to another account.' } };
    } else {
        const account = await usePrisma.account.create({
            data: {
                name: accountName,
            },
        });
        let fbUser = await getAuth().createUser({ email: email, password: password });
        let firebaseId = fbUser.uid;

        const user = await usePrisma.user.create({
            data: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                account: { connect: { id: account.id } },
                firebaseId: firebaseId,
            },
        });

        return { data: { id: user } };
    }
}
