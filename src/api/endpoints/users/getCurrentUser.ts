import mysql from '../../../common/mysql_worker';
import { IApiResponse } from '../../../common/apiTypes';
import { usePrisma } from '../..';
import { number, z, ZodError } from 'zod';
import { zValidNumber } from '../../../utils/opsUtils';

const Props = z.object({
    accountId: zValidNumber,
    userId: zValidNumber,
});

type IProps = z.infer<typeof Props>;

export default async function getCurrentUser(props: IProps): Promise<IApiResponse> {
    const aurora = mysql();
    try {
        let useProps = Props.parse(props);
        const { accountId, userId } = useProps;

        let user = await usePrisma.user.findUnique({
            where: { id: userId },
        });

        if (user) {
            return { data: user };
        }

        return { error: { message: 'User not found' } };
    } catch (e) {
        if (e instanceof ZodError) {
            console.log(e.flatten());
            //@ts-ignore
            return { error: e.flatten() };
        } else {
            throw e;
        }
    }
}
