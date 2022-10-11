import { IApiResponse } from '../../../common/apiTypes';
import { usePrisma } from '../..';
import { number, object, string, z, ZodError } from 'zod';
import { zValidNumber } from '../../../utils/opsUtils';
import { getAuth } from 'firebase-admin/auth';

const Props = z.object({
    accountId: zValidNumber,
    params: object({
        firstName: string().optional(),
        lastName: string().optional(),
        email: string().email(),
    }),
});

type IProps = z.infer<typeof Props>;

export default async function createUser(props: IProps): Promise<IApiResponse> {
    try {
        let useProps = Props.parse(props);
        const { accountId, params } = useProps;
        const { firstName, lastName, email } = params;

        let emailExists = await usePrisma.user.findFirst({
            where: { email: email, accountId },
        });

        if (emailExists) {
            return { error: { message: `User with email ${email} already exists` } };
        }

        let fbUser = await getAuth().createUser({ email: email });
        let firebaseId = fbUser.uid;

        const user = await usePrisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                accountId,
                firebaseId: firebaseId,
            },
        });

        let resetPasswordLink = await getAuth().generatePasswordResetLink(email);

        //We should send this email!
        // console.log(resetPasswordLink);

        return { data: { id: user } };

        return { data: { user } };
    } catch (e) {
        console.log(e);
        if (e instanceof ZodError) {
            return { error: { message: e.flatten.toString() } };
        } else {
            throw e;
        }
    }
}
