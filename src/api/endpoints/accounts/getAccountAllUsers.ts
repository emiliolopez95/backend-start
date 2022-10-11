import mysql from '../../../common/mysql_worker';
import { IApiResponse } from '../../../common/apiTypes';
import { usePrisma } from '../..';
import { boolean, number, string, z, ZodError } from 'zod';
import opsUtils, { zValidNumber } from '../../../utils/opsUtils';

const Props = z.object({
    accountId: zValidNumber,
});

type IProps = z.infer<typeof Props>;

export default async function getAccountAllUsers(props: IProps): Promise<IApiResponse> {
    const aurora = mysql();
    try {
        let useProps = Props.parse(props);
        const { accountId } = useProps;

        const users = await usePrisma.user.findMany({ where: { accountId } });

        return { data: { users } };
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
